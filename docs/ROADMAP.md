# Project Roadmap

## Table of Contents
- [Completed Features](#completed-features)
- [High Priority - Next Steps](#high-priority---next-steps)
- [Medium Priority](#medium-priority)
- [Low Priority / Future Enhancements](#low-priority--future-enhancements)
- [Technical Debt](#technical-debt)
- [Infrastructure Improvements](#infrastructure-improvements)

---

## Completed Features ✅

### Authentication & Authorization
- [x] SSO authentication with NUPIC API
- [x] Auth guard for protected routes
- [x] Token management with signals
- [x] Auto-redirect to SSO login
- [x] Session persistence

### API Integration
- [x] Base API service with HTTP utilities
- [x] Suppliers API integration (TanStack Query)
- [x] Audits API integration (TanStack Query)
- [x] Pagination support
- [x] Error handling
- [x] TypeScript models and interfaces

### UI Components
- [x] Dialog component (modal)
- [x] Table component with sorting
- [x] Navigation drawer sidebar
- [x] Active navigation highlighting
- [x] Preview dialog for detail views
- [x] Searchable select component

### Dynamic Forms System
- [x] Zod schema-based form generation
- [x] Automatic validation
- [x] Multiple field types (text, email, number, date, select, textarea, etc.)
- [x] Grid layout support
- [x] Conditional field visibility
- [x] Nested objects and arrays
- [x] Searchable select integration

### Features
- [x] Suppliers table with pagination
- [x] Supplier create/edit forms
- [x] Audits table with pagination
- [x] Audit create/edit forms
- [x] Audit number searchable select (populated from API)
- [x] Supplier number searchable select (populated from API)

### Styling & Theming
- [x] DaisyUI component library integration
- [x] Tailwind CSS utility classes
- [x] Responsive design
- [x] Dark mode support (via DaisyUI themes)

---

## High Priority - Next Steps

### 1. Complete Audit Form Implementation
**Priority:** 🔴 High
**Estimated Effort:** 2-3 days

- [ ] Add audit type dropdown (populate from `getAuditTypesQuery()`)
- [ ] Implement audit approval workflow
  - [ ] Approval button for authorized users
  - [ ] Approval status badge
  - [ ] Approval date tracking
- [ ] Add audit details view (read-only)
- [ ] Implement audit search/filter functionality
- [ ] Add audit date range filtering

**Files to modify:**
- `src/app/features/audits/audit-edit.component.ts`
- `src/app/features/audits/audits-table.component.ts`
- `src/app/core/api/services/audits.service.ts`

### 2. User Management
**Priority:** 🔴 High
**Estimated Effort:** 4-5 days

- [ ] Create users API service
- [ ] User list table component
- [ ] User create/edit form
- [ ] User roles and permissions
- [ ] Assign users to audits
- [ ] User profile page

**New files to create:**
- `src/app/core/api/models/user.model.ts`
- `src/app/core/api/services/users.service.ts`
- `src/app/features/users/users-table.component.ts`
- `src/app/features/users/user-edit.component.ts`

### 3. Dashboard/Home Page
**Priority:** 🔴 High
**Estimated Effort:** 3-4 days

- [ ] Create dashboard component
- [ ] Statistics cards (total audits, suppliers, pending approvals)
- [ ] Recent audits list
- [ ] Upcoming audit deadlines
- [ ] Charts/graphs (optional - use Chart.js or similar)
- [ ] Quick actions panel

**New files to create:**
- `src/app/features/dashboard/dashboard.component.ts`
- `src/app/shared/components/stat-card/stat-card.component.ts`

### 4. Notifications System
**Priority:** 🟡 High
**Estimated Effort:** 2-3 days

- [ ] Toast notification component
- [ ] Notification service with signals
- [ ] Success/error/warning/info types
- [ ] Auto-dismiss functionality
- [ ] Notification queue management
- [ ] Integration with API error handling

**New files to create:**
- `src/app/core/services/notification.service.ts`
- `src/app/shared/components/toast/toast.component.ts`

---

## Medium Priority

### 5. Advanced Table Features
**Priority:** 🟡 Medium
**Estimated Effort:** 3-4 days

- [ ] Column visibility toggle
- [ ] Column reordering (drag & drop)
- [ ] Export to CSV/Excel
- [ ] Advanced filtering (multi-column)
- [ ] Saved filter presets
- [ ] Bulk actions (select multiple rows)
- [ ] Row selection checkboxes

**Files to modify:**
- `src/app/shared/components/ui/table/table.component.ts`

### 6. File Upload & Document Management
**Priority:** 🟡 Medium
**Estimated Effort:** 4-5 days

- [ ] File upload component (drag & drop)
- [ ] File preview (images, PDFs)
- [ ] Document list component
- [ ] Attach documents to audits
- [ ] Document versioning
- [ ] Download/delete documents

**New files to create:**
- `src/app/shared/components/file-upload/file-upload.component.ts`
- `src/app/shared/components/file-preview/file-preview.component.ts`
- `src/app/core/api/services/documents.service.ts`
- `src/app/core/api/models/document.model.ts`

### 7. Audit Workflow States
**Priority:** 🟡 Medium
**Estimated Effort:** 3-4 days

- [ ] Define audit workflow states (Draft, In Progress, Review, Approved, Closed)
- [ ] State transition logic
- [ ] State badges/indicators
- [ ] State history tracking
- [ ] Workflow validation rules
- [ ] State-specific actions/permissions

**Files to modify:**
- `src/app/core/api/models/audit.model.ts`
- `src/app/features/audits/audits-table.component.ts`
- `src/app/features/audits/audit-edit.component.ts`

### 8. Supplier Details Enhancement
**Priority:** 🟡 Medium
**Estimated Effort:** 2-3 days

- [ ] Supplier detail page with tabs
  - [ ] Overview tab (basic info)
  - [ ] Audits tab (audits for this supplier)
  - [ ] Contacts tab (multiple contacts)
  - [ ] Documents tab
  - [ ] History tab (changes log)
- [ ] Supplier search by multiple criteria
- [ ] Supplier status workflow
- [ ] Supplier rating/scoring

**New files to create:**
- `src/app/features/suppliers/supplier-detail.component.ts`

### 9. Comments & Activity Feed
**Priority:** 🟡 Medium
**Estimated Effort:** 3-4 days

- [ ] Comments API service
- [ ] Comment component (with mentions)
- [ ] Activity feed component
- [ ] Add comments to audits
- [ ] Activity log (who did what, when)
- [ ] Rich text editor (optional)

**New files to create:**
- `src/app/core/api/services/comments.service.ts`
- `src/app/core/api/models/comment.model.ts`
- `src/app/shared/components/comment/comment.component.ts`
- `src/app/shared/components/activity-feed/activity-feed.component.ts`

---

## Low Priority / Future Enhancements

### 10. Advanced Reporting
**Priority:** 🟢 Low
**Estimated Effort:** 5-7 days

- [ ] Report builder UI
- [ ] Custom report templates
- [ ] Scheduled reports
- [ ] Export reports (PDF, Excel)
- [ ] Report charts and visualizations
- [ ] Email report distribution

### 11. Calendar View
**Priority:** 🟢 Low
**Estimated Effort:** 3-4 days

- [ ] Calendar component integration (FullCalendar or similar)
- [ ] Audit scheduling
- [ ] Audit deadline visualization
- [ ] Drag-and-drop rescheduling
- [ ] Calendar filters

### 12. Email Integration
**Priority:** 🟢 Low
**Estimated Effort:** 4-5 days

- [ ] Email notification service
- [ ] Email templates
- [ ] Send audit notifications
- [ ] Send approval reminders
- [ ] Send deadline alerts
- [ ] Email configuration settings

### 13. Mobile Optimization
**Priority:** 🟢 Low
**Estimated Effort:** 3-4 days

- [ ] Mobile-optimized table view (cards instead of tables)
- [ ] Mobile navigation (hamburger menu)
- [ ] Touch-friendly components
- [ ] PWA capabilities (service worker, offline support)
- [ ] Install as app prompt

### 14. Settings & Configuration
**Priority:** 🟢 Low
**Estimated Effort:** 2-3 days

- [ ] Settings page
- [ ] User preferences (theme, language, notifications)
- [ ] Application configuration
- [ ] Audit type management
- [ ] Category management
- [ ] System settings (admin only)

### 15. Help & Documentation
**Priority:** 🟢 Low
**Estimated Effort:** 2-3 days

- [ ] In-app help/documentation
- [ ] Tooltips for complex features
- [ ] Getting started guide
- [ ] Video tutorials
- [ ] FAQ section
- [ ] Contact support form

---

## Technical Debt

### Code Quality
**Priority:** 🟡 Medium
**Estimated Effort:** Ongoing

- [ ] Add unit tests for services
  - [ ] Auth service tests
  - [ ] API services tests
  - [ ] Form validation tests
- [ ] Add integration tests for components
  - [ ] Table component tests
  - [ ] Form component tests
  - [ ] Navigation tests
- [ ] Add E2E tests for critical flows
  - [ ] Login flow
  - [ ] Create audit flow
  - [ ] Edit supplier flow
- [ ] Improve error handling consistency
- [ ] Add JSDoc comments to public APIs
- [ ] Refactor example-api component (currently has TODOs)

### Performance Optimization
**Priority:** 🟢 Low
**Estimated Effort:** 2-3 days

- [ ] Implement virtual scrolling for large tables
- [ ] Optimize bundle size (lazy loading, tree shaking)
- [ ] Add service worker for caching
- [ ] Optimize image loading
- [ ] Reduce initial bundle size (currently 983 kB)
- [ ] Code splitting optimization

### Accessibility
**Priority:** 🟡 Medium
**Estimated Effort:** 2-3 days

- [ ] Add ARIA labels to interactive elements
- [ ] Keyboard navigation support for all features
- [ ] Screen reader testing
- [ ] Color contrast compliance (WCAG AA)
- [ ] Focus management in modals
- [ ] Semantic HTML improvements

### Security
**Priority:** 🔴 High
**Estimated Effort:** 2-3 days

- [ ] Add CSRF protection
- [ ] Implement rate limiting on API calls
- [ ] Add input sanitization
- [ ] Security headers configuration
- [ ] Content Security Policy (CSP)
- [ ] Regular dependency updates

---

## Infrastructure Improvements

### DevOps & CI/CD
**Priority:** 🟡 Medium
**Estimated Effort:** 3-4 days

- [ ] Set up CI/CD pipeline (GitHub Actions, GitLab CI, etc.)
- [ ] Automated testing in CI
- [ ] Automated deployments
- [ ] Environment-specific builds
- [ ] Automated code quality checks (linting, formatting)
- [ ] Automated security scanning

### Monitoring & Logging
**Priority:** 🟡 Medium
**Estimated Effort:** 2-3 days

- [ ] Application performance monitoring (APM)
- [ ] Error tracking (Sentry, Rollbar, etc.)
- [ ] Analytics integration
- [ ] User behavior tracking
- [ ] API performance monitoring
- [ ] Logging service integration

### Development Tools
**Priority:** 🟢 Low
**Estimated Effort:** 1-2 days

- [ ] Storybook for component documentation
- [ ] Code generation scripts
- [ ] Development seed data
- [ ] Mock API server for offline development
- [ ] Git hooks for pre-commit checks

---

## Implementation Priorities

### Phase 1 (Next 2-3 weeks)
Focus on completing core functionality:
1. Complete Audit Form Implementation
2. User Management
3. Dashboard/Home Page
4. Notifications System

### Phase 2 (Weeks 4-6)
Enhance existing features:
1. Advanced Table Features
2. File Upload & Document Management
3. Audit Workflow States
4. Supplier Details Enhancement

### Phase 3 (Weeks 7-9)
Add collaboration features:
1. Comments & Activity Feed
2. Advanced Reporting
3. Email Integration

### Phase 4 (Weeks 10-12)
Polish and optimize:
1. Mobile Optimization
2. Settings & Configuration
3. Performance Optimization
4. Accessibility improvements
5. Testing coverage

---

## Quick Wins (Can be done anytime)

These are small enhancements that provide immediate value:

- [ ] Add loading skeletons instead of spinners
- [ ] Add empty state illustrations
- [ ] Add keyboard shortcuts (Ctrl+K for search, etc.)
- [ ] Add breadcrumbs for navigation
- [ ] Add "back to top" button for long pages
- [ ] Add copy-to-clipboard buttons for IDs
- [ ] Add confirm dialogs for destructive actions
- [ ] Add form autosave (drafts)
- [ ] Add recently viewed items
- [ ] Add favorites/bookmarks

---

## Feature Request Template

When proposing new features, use this template:

```markdown
### Feature Name
**Priority:** 🔴 High / 🟡 Medium / 🟢 Low
**Estimated Effort:** X days

**Description:**
Brief description of the feature

**Requirements:**
- [ ] Requirement 1
- [ ] Requirement 2

**Files to create:**
- `path/to/new/file.ts`

**Files to modify:**
- `path/to/existing/file.ts`

**Dependencies:**
- Any external packages needed

**Notes:**
Additional context or considerations
```

---

## Contributing

When working on roadmap items:

1. **Create a branch** for your feature: `feature/feature-name`
2. **Update this roadmap** by checking off completed items
3. **Add documentation** for new features
4. **Write tests** for new functionality
5. **Submit a pull request** with a clear description

---

## Questions or Suggestions?

If you have ideas for new features or improvements not listed here, please:
- Open an issue on GitHub
- Discuss with the team
- Update this roadmap with consensus

---

**Last Updated:** 2025-11-07
**Next Review Date:** 2025-11-14
