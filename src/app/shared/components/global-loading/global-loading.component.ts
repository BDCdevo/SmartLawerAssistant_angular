import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadingService } from '../../../core/services/loading.service';

@Component({
  selector: 'app-global-loading',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (loadingService.loading()) {
      <div class="global-loading-overlay">
        <div class="loading-spinner">
          <div class="spinner"></div>
          <p class="loading-text">جاري التحميل...</p>
          @if (loadingService.activeRequests() > 1) {
            <p class="requests-count">{{ loadingService.activeRequests() }} طلبات نشطة</p>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    .global-loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      backdrop-filter: blur(2px);
    }

    .loading-spinner {
      background: white;
      padding: 2rem;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      min-width: 200px;
    }

    .spinner {
      width: 50px;
      height: 50px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #3b82f6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .loading-text {
      margin: 0;
      color: #374151;
      font-size: 1rem;
      font-weight: 500;
    }

    .requests-count {
      margin: 0;
      color: #6b7280;
      font-size: 0.875rem;
    }
  `]
})
export class GlobalLoadingComponent {
  loadingService = inject(LoadingService);
}
