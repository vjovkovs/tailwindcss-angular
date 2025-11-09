import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
// import { fadeInOut } from '../../services/animations';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [CommonModule],
  template: `<div class="flex justify-center min-h-screen bg-gray-50 px-4">
  <div class="max-w-md w-full">
    <div class="text-center">
      <div class="mb-6">
        <h1 class="text-8xl font-bold text-red-500">401</h1>
      </div>
      <h2 class="text-4xl font-bold text-gray-900 mb-4">Unauthorized</h2>
      <p class="text-lg text-gray-600 mb-6">
        Sorry, you do not have access to this application.
      </p>
      <p class="text-sm text-gray-500">
        If you believe this is an error, please contact your system administrator.
      </p>
    </div>
  </div>
</div>`
})
export class UnauthorizedComponent {

}
