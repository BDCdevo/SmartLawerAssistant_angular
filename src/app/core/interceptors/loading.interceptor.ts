import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { LoadingService } from '../services/loading.service';

/**
 * Loading Interceptor
 * Automatically shows/hides global loading indicator for HTTP requests
 *
 * Skip loading for specific endpoints by adding 'skipLoading' header:
 * this.http.get(url, { headers: { skipLoading: 'true' } })
 */
export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loadingService = inject(LoadingService);

  // Check if request should skip loading indicator
  const skipLoading = req.headers.has('skipLoading');

  // Remove the skipLoading header before sending the request
  if (skipLoading) {
    req = req.clone({
      headers: req.headers.delete('skipLoading')
    });
  }

  // Show loading indicator if not skipped
  if (!skipLoading) {
    loadingService.show();
  }

  return next(req).pipe(
    finalize(() => {
      // Hide loading indicator when request completes (success or error)
      if (!skipLoading) {
        loadingService.hide();
      }
    })
  );
};
