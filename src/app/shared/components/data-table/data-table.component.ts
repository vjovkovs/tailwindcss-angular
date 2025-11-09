/**
 * Data Table Component
 *
 * A comprehensive, reusable table component with:
 * - Sorting
 * - Filtering
 * - Pagination
 * - Search
 * - Row actions
 * - Row selection
 */

import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  effect,
  input,
  output,
  signal,
  TemplateRef,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  TableAction,
  TableColumn,
  TableConfig,
  TableFilter,
  TableSort,
  TableState,
  SortDirection,
  FilterOperator,
} from './data-table.types';

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.css'],
})
export class DataTableComponent<T extends Record<string, any>> {
  // Inputs
  data = input.required<T[]>();
  config = input.required<TableConfig<T>>();
  loading = input<boolean>(false);

  // Outputs
  rowClick = output<T>();
  selectionChange = output<T[]>();
  sortChange = output<TableSort<T>>();
  filterChange = output<TableFilter<T>[]>();
  pageChange = output<{ pageNumber: number; pageSize: number }>();

  // Internal state
  searchTerm = signal('');
  currentSort = signal<TableSort<T> | null>(null);
  currentFilters = signal<TableFilter<T>[]>([]);
  currentPage = signal(1);
  pageSize = signal(10);
  selectedRows = signal<T[]>([]);

  // Computed values
  visibleColumns = computed(() => {
    return this.config().columns.filter((col) => col.visible !== false);
  });

  filteredData = computed(() => {
    let result = [...this.data()];

    // Apply search
    const search = this.searchTerm().toLowerCase().trim();
    if (search && this.config().searchable) {
      result = result.filter((row) => {
        return this.visibleColumns().some((col) => {
          const value = row[col.field];
          return value?.toString().toLowerCase().includes(search);
        });
      });
    }

    // Apply filters
    const filters = this.currentFilters();
    filters.forEach((filter) => {
      result = result.filter((row) => {
        return this.applyFilter(row, filter);
      });
    });

    return result;
  });

  sortedData = computed(() => {
    const sort = this.currentSort();
    if (!sort || !sort.direction) {
      return this.filteredData();
    }

    return [...this.filteredData()].sort((a, b) => {
      const aVal = a[sort.field];
      const bVal = b[sort.field];

      let comparison = 0;
      if (aVal > bVal) comparison = 1;
      if (aVal < bVal) comparison = -1;

      return sort.direction === 'asc' ? comparison : -comparison;
    });
  });

  paginatedData = computed(() => {
    if (!this.config().pageable) {
      return this.sortedData();
    }

    const start = (this.currentPage() - 1) * this.pageSize();
    const end = start + this.pageSize();
    return this.sortedData().slice(start, end);
  });

  totalPages = computed(() => {
    if (!this.config().pageable) return 1;
    return Math.ceil(this.sortedData().length / this.pageSize());
  });

  totalCount = computed(() => this.sortedData().length);

  showingFrom = computed(() => {
    if (!this.config().pageable || this.totalCount() === 0) return 0;
    return (this.currentPage() - 1) * this.pageSize() + 1;
  });

  showingTo = computed(() => {
    if (!this.config().pageable || this.totalCount() === 0) return 0;
    return Math.min(this.currentPage() * this.pageSize(), this.totalCount());
  });

  pageSizeOptions = computed(() => {
    return this.config().pageSizeOptions || [10, 25, 50, 100];
  });

  hasActions = computed(() => {
    return this.config().actions && this.config().actions!.length > 0;
  });

  constructor() {
    // Initialize page size from config
    effect(() => {
      const defaultSize = this.config().defaultPageSize;
      if (defaultSize) {
        this.pageSize.set(defaultSize);
      }
    });

    // Reset to page 1 when data changes
    effect(() => {
      this.data();
      this.currentPage.set(1);
    });
  }

  /**
   * Apply filter to a row
   */
  private applyFilter(row: T, filter: TableFilter<T>): boolean {
    const value = row[filter.field];
    const filterValue = filter.value;

    switch (filter.operator) {
      case 'equals':
        return value === filterValue;
      case 'contains':
        return value?.toString().toLowerCase().includes(filterValue.toLowerCase());
      case 'startsWith':
        return value?.toString().toLowerCase().startsWith(filterValue.toLowerCase());
      case 'endsWith':
        return value?.toString().toLowerCase().endsWith(filterValue.toLowerCase());
      case 'greaterThan':
        return value > filterValue;
      case 'lessThan':
        return value < filterValue;
      default:
        return true;
    }
  }

  /**
   * Toggle sort for a column
   */
  toggleSort(column: TableColumn<T>): void {
    if (!column.sortable) return;

    const current = this.currentSort();
    let newDirection: SortDirection = 'asc';

    if (current?.field === column.field) {
      if (current.direction === 'asc') newDirection = 'desc';
      else if (current.direction === 'desc') newDirection = null;
    }

    const newSort: TableSort<T> | null = newDirection
      ? { field: column.field, direction: newDirection }
      : null;

    this.currentSort.set(newSort);
    if (newSort) {
      this.sortChange.emit(newSort);
    }
  }

  /**
   * Get sort direction for a column
   */
  getSortDirection(column: TableColumn<T>): SortDirection {
    const current = this.currentSort();
    if (current?.field === column.field) {
      return current.direction;
    }
    return null;
  }

  /**
   * Handle search input
   */
  onSearchChange(value: string): void {
    this.searchTerm.set(value);
    this.currentPage.set(1); // Reset to first page
  }

  /**
   * Handle page size change
   */
  onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.currentPage.set(1); // Reset to first page
    this.pageChange.emit({ pageNumber: 1, pageSize: size });
  }

  /**
   * Go to specific page
   */
  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    this.pageChange.emit({ pageNumber: page, pageSize: this.pageSize() });
  }

  /**
   * Go to next page
   */
  nextPage(): void {
    this.goToPage(this.currentPage() + 1);
  }

  /**
   * Go to previous page
   */
  previousPage(): void {
    this.goToPage(this.currentPage() - 1);
  }

  /**
   * Handle row click
   */
  onRowClick(row: T): void {
    if (this.config().onRowClick) {
      this.config().onRowClick!(row);
    }
    this.rowClick.emit(row);
  }

  /**
   * Toggle row selection
   */
  toggleRowSelection(row: T): void {
    const selected = this.selectedRows();
    const index = selected.indexOf(row);

    if (index > -1) {
      this.selectedRows.set(selected.filter((r) => r !== row));
    } else {
      if (this.config().multiSelect) {
        this.selectedRows.set([...selected, row]);
      } else {
        this.selectedRows.set([row]);
      }
    }

    this.selectionChange.emit(this.selectedRows());
  }

  /**
   * Check if row is selected
   */
  isRowSelected(row: T): boolean {
    return this.selectedRows().includes(row);
  }

  /**
   * Toggle all rows selection
   */
  toggleAllRows(): void {
    if (this.selectedRows().length === this.paginatedData().length) {
      this.selectedRows.set([]);
    } else {
      this.selectedRows.set([...this.paginatedData()]);
    }
    this.selectionChange.emit(this.selectedRows());
  }

  /**
   * Get cell value
   */
  getCellValue(row: T, column: TableColumn<T>): string {
    const value = row[column.field];
    if (column.format) {
      return column.format(value, row);
    }
    return value?.toString() || '';
  }

  /**
   * Check if action is visible for row
   */
  isActionVisible(action: TableAction<T>, row: T): boolean {
    return action.visible ? action.visible(row) : true;
  }

  /**
   * Check if action is disabled for row
   */
  isActionDisabled(action: TableAction<T>, row: T): boolean {
    return action.disabled ? action.disabled(row) : false;
  }

  /**
   * Handle action click
   */
  onActionClick(action: TableAction<T>, row: T, event: Event): void {
    event.stopPropagation();
    if (!this.isActionDisabled(action, row)) {
      action.handler(row);
    }
  }

  /**
   * Handle new button click
   */
  onNewClick(): void {
    if (this.config().onNew) {
      this.config().onNew!();
    }
  }

  /**
   * Get page numbers for pagination
   */
  getPageNumbers(): number[] {
    const total = this.totalPages();
    const current = this.currentPage();
    const delta = 2;
    const range: number[] = [];
    const rangeWithDots: (number | string)[] = [];

    for (
      let i = Math.max(2, current - delta);
      i <= Math.min(total - 1, current + delta);
      i++
    ) {
      range.push(i);
    }

    if (current - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (current + delta < total - 1) {
      rangeWithDots.push('...', total);
    } else if (total > 1) {
      rangeWithDots.push(total);
    }

    return rangeWithDots.filter((n) => typeof n === 'number') as number[];
  }
}
