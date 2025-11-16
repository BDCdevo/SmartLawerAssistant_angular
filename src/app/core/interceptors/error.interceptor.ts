import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const toastr = inject(ToastrService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'حدث خطأ غير متوقع';
      let showToast = true;

      if (error.error instanceof ErrorEvent) {
        // Client-side error
        errorMessage = `خطأ في الاتصال: ${error.error.message}`;
      } else {
        // Server-side error
        switch (error.status) {
          case 0:
            errorMessage = 'لا يمكن الاتصال بالخادم. تحقق من الاتصال بالإنترنت';
            break;
          case 400:
            errorMessage = error.error?.message || 'بيانات غير صحيحة';
            break;
          case 401:
            errorMessage = 'انتهت جلسة العمل. يرجى تسجيل الدخول مرة أخرى';
            toastr.error(errorMessage, 'خطأ في المصادقة');
            router.navigate(['/auth/login']);
            showToast = false; // Already shown above
            break;
          case 403:
            errorMessage = 'ليس لديك صلاحية للوصول إلى هذا المورد';
            break;
          case 404:
            errorMessage = 'المورد المطلوب غير موجود';
            break;
          case 422:
            errorMessage = error.error?.message || 'خطأ في التحقق من البيانات';
            if (error.error?.errors && typeof error.error.errors === 'object') {
              const validationErrors = Object.values(error.error.errors).flat();
              if (validationErrors.length > 0) {
                errorMessage = validationErrors.join('<br>');
              }
            }
            break;
          case 429:
            errorMessage = 'تم تجاوز الحد المسموح من الطلبات. يرجى المحاولة لاحقاً';
            break;
          case 500:
            // Try to extract more specific error message from backend
            errorMessage = error.error?.message || error.error?.Message || 'خطأ في الخادم. يرجى المحاولة لاحقاً';
            break;
          case 503:
            errorMessage = 'الخدمة غير متاحة حالياً. يرجى المحاولة لاحقاً';
            break;
          default:
            errorMessage = error.error?.message || `خطأ ${error.status}: ${error.statusText}`;
        }
      }

      // Don't show toast for specific endpoints (e.g., silent checks) or status 200 (false positives)
      const silentEndpoints = ['/check-phone', '/check-email', '/test-redis'];
      const isSilent = silentEndpoints.some(endpoint => req.url.includes(endpoint));
      const is200Error = error.status === 200; // Response parsing issue, not a real error

      if (showToast && !isSilent && !is200Error) {
        toastr.error(errorMessage, 'خطأ', { enableHtml: true });
      }

      // Log error details for debugging
      // Don't log 401 (expected) or 200 (false positive from response parsing issues)
      if (error.status !== 401 && error.status !== 200) {
        console.error('HTTP Error Details:', {
          url: req.url,
          method: req.method,
          status: error.status,
          statusText: error.statusText,
          message: errorMessage,
          error: error.error
        });
      }

      // If status is 200 but treated as error, it's likely a response parsing issue
      // Log it differently for debugging
      if (error.status === 200) {
        console.warn('⚠️ Response Parsing Issue (Status 200 treated as error):', {
          url: req.url,
          method: req.method,
          error: error.error
        });
      }

      return throwError(() => error);
    })
  );
};
