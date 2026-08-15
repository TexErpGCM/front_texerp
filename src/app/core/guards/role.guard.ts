import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = route => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const allowedRoles = route.data?.['roles'] as string[] | undefined;

  if (!auth.isLoggedIn()) {
    return router.createUrlTree(['/login']);
  }

  if (!allowedRoles?.length || auth.hasRole(allowedRoles)) {
    return true;
  }

  return router.createUrlTree(['/unauthorized']);
};
