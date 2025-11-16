import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type SkeletonType = 'text' | 'title' | 'avatar' | 'card' | 'table' | 'list';

@Component({
  selector: 'app-skeleton-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    @switch (type) {
      @case ('text') {
        <div class="skeleton skeleton-text" [style.width.%]="width" [style.height.px]="height || 16"></div>
      }
      @case ('title') {
        <div class="skeleton skeleton-title" [style.width.%]="width || 60" [style.height.px]="height || 24"></div>
      }
      @case ('avatar') {
        <div class="skeleton skeleton-avatar" [style.width.px]="size || 40" [style.height.px]="size || 40"></div>
      }
      @case ('card') {
        <div class="skeleton-card">
          <div class="skeleton skeleton-title" style="width: 70%; height: 24px;"></div>
          <div class="skeleton skeleton-text" style="width: 100%; height: 16px; margin-top: 12px;"></div>
          <div class="skeleton skeleton-text" style="width: 90%; height: 16px; margin-top: 8px;"></div>
          <div class="skeleton skeleton-text" style="width: 80%; height: 16px; margin-top: 8px;"></div>
        </div>
      }
      @case ('table') {
        <div class="skeleton-table">
          @for (row of [1,2,3,4,5]; track row) {
            <div class="skeleton-table-row">
              @for (col of [1,2,3,4]; track col) {
                <div class="skeleton skeleton-text" [style.width.%]="col === 1 ? 25 : col === 2 ? 35 : col === 3 ? 25 : 15"></div>
              }
            </div>
          }
        </div>
      }
      @case ('list') {
        <div class="skeleton-list">
          @for (item of Array(count); track item; let i = $index) {
            <div class="skeleton-list-item">
              <div class="skeleton skeleton-avatar" style="width: 48px; height: 48px;"></div>
              <div class="skeleton-list-content">
                <div class="skeleton skeleton-title" style="width: 60%; height: 20px;"></div>
                <div class="skeleton skeleton-text" style="width: 80%; height: 14px; margin-top: 8px;"></div>
              </div>
            </div>
          }
        </div>
      }
      @default {
        <div class="skeleton" [style.width.%]="width" [style.height.px]="height"></div>
      }
    }
  `,
  styles: [`
    .skeleton {
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: loading 1.5s ease-in-out infinite;
      border-radius: 4px;
    }

    @keyframes loading {
      0% {
        background-position: 200% 0;
      }
      100% {
        background-position: -200% 0;
      }
    }

    .skeleton-text {
      height: 16px;
      margin-bottom: 8px;
    }

    .skeleton-title {
      height: 24px;
      margin-bottom: 12px;
    }

    .skeleton-avatar {
      border-radius: 50%;
    }

    .skeleton-card {
      padding: 1.5rem;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      background: white;
    }

    .skeleton-table {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .skeleton-table-row {
      display: flex;
      gap: 16px;
      align-items: center;
      padding: 12px;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      background: white;
    }

    .skeleton-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .skeleton-list-item {
      display: flex;
      gap: 16px;
      align-items: center;
      padding: 12px;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      background: white;
    }

    .skeleton-list-content {
      flex: 1;
    }
  `]
})
export class SkeletonLoaderComponent {
  @Input() type: SkeletonType = 'text';
  @Input() width: number = 100;
  @Input() height?: number;
  @Input() size?: number;
  @Input() count: number = 3;

  Array = Array;
}
