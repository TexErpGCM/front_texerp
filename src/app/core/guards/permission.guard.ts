import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { AppPermission, PermissionService } from '../services/permission.service';

export const permissionGuard: CanActivateFn = route => {
  const auth = inject(AuthService);
  const permissions = inject(PermissionService);
  const router = inject(Router);
  const required = (route.data?.['permissions'] ?? []) as AppPermission[];

  if (!auth.isLoggedIn()) return router.createUrlTree(['/login']);
  if (!required.length || permissions.hasAny(required)) return true;
  return router.createUrlTree(['/unauthorized']);
};
