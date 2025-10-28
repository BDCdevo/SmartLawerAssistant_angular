import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log('authGuard - isAuthenticated:', authService.isAuthenticated);
  console.log('authGuard - currentUser:', authService.currentUser);
  console.log('authGuard - token:', authService.getToken());

  if (authService.isAuthenticated) {
    console.log('authGuard - Access granted to:', state.url);
    return true;
  }

  console.log('authGuard - Access denied, redirecting to login');
  // Store the attempted URL for redirecting
  router.navigate(['/auth/login'], {
    queryParams: { returnUrl: state.url }
  });

  return false;
};

export const guestGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated) {
    return true;
  }

  router.navigate(['/dashboard']);
  return false;
};

export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
  return (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const user = authService.currentUser;

    if (user && allowedRoles.includes(user.role)) {
      return true;
    }

    router.navigate(['/unauthorized']);
    return false;
  };
};
