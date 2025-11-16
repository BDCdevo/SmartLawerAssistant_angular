import { HttpInterceptorFn } from '@angular/common/http';

/**
 * Credentials Interceptor
 * Adds withCredentials: true to all HTTP requests
 * This allows cookies to be sent and received
 */
export const credentialsInterceptor: HttpInterceptorFn = (req, next) => {
  // ✅ Enable withCredentials for all requests
  const clonedRequest = req.clone({
    withCredentials: true
  });

  return next(clonedRequest);
};
