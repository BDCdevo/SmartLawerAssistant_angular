import { Injectable, signal } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  // Using signals for modern Angular reactivity
  private loadingSignal = signal(false);
  private activeRequestsSignal = signal(0);

  // BehaviorSubject for backward compatibility and Observable support
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private activeRequestsSubject = new BehaviorSubject<number>(0);

  // Public observables
  loading$ = this.loadingSubject.asObservable();
  activeRequests$ = this.activeRequestsSubject.asObservable();

  // Public signals (readonly)
  readonly loading = this.loadingSignal.asReadonly();
  readonly activeRequests = this.activeRequestsSignal.asReadonly();

  /**
   * Show loading indicator
   */
  show(): void {
    const current = this.activeRequestsSignal();
    this.activeRequestsSignal.set(current + 1);
    this.activeRequestsSubject.next(current + 1);

    if (!this.loadingSignal()) {
      this.loadingSignal.set(true);
      this.loadingSubject.next(true);
    }
  }

  /**
   * Hide loading indicator
   */
  hide(): void {
    const current = this.activeRequestsSignal();
    const newCount = Math.max(0, current - 1);

    this.activeRequestsSignal.set(newCount);
    this.activeRequestsSubject.next(newCount);

    if (newCount === 0 && this.loadingSignal()) {
      this.loadingSignal.set(false);
      this.loadingSubject.next(false);
    }
  }

  /**
   * Reset loading state (force hide all)
   */
  reset(): void {
    this.loadingSignal.set(false);
    this.activeRequestsSignal.set(0);
    this.loadingSubject.next(false);
    this.activeRequestsSubject.next(0);
  }

  /**
   * Check if currently loading
   */
  isLoading(): boolean {
    return this.loadingSignal();
  }

  /**
   * Get active requests count
   */
  getActiveRequestsCount(): number {
    return this.activeRequestsSignal();
  }
}
