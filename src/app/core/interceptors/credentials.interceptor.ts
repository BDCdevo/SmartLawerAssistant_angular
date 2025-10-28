import { HttpInterceptorFn } from '@angular/common/http';

/**
 * Credentials Interceptor
 * Adds withCredentials: true to all HTTP requests
 * This allows cookies to be sent and received
 *
 * TEMPORARY: Disabled until Backend CORS is configured
 */
export const credentialsInterceptor: HttpInterceptorFn = (req, next) => {
  // TEMPORARY: Disabled withCredentials due to CORS issues
  // TODO: Enable after Backend adds CORS support with AllowCredentials

  // const clonedRequest = req.clone({
  //   withCredentials: true
  // });
  // return next(clonedRequest);

  console.log(`[Credentials Interceptor] ${req.method} ${req.url} - withCredentials: DISABLED (CORS fix needed)`);

  return next(req);
};
