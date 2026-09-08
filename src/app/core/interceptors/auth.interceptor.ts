import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { clearStoredSession, isTokenExpired } from '../utils/session.util';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const isLoginRequest = req.url.includes('/auth/login');
  let token = localStorage.getItem('token');

  if (token && isTokenExpired(token)) {
    clearStoredSession();
    token = null;

    if (!isLoginRequest) {
      void router.navigate(['/login']);
    }
  }

  const tokenType = localStorage.getItem('tokenType') || 'Bearer';
  
  const request = token && !isLoginRequest
    ? req.clone({ setHeaders: { Authorization: `${tokenType.trim()} ${token}` } })
    : req;

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      // 401: Token inválido/expirado en backend | 403: Sin permisos de rol
      if ((error.status === 401 || error.status === 403) && !isLoginRequest) {
        clearStoredSession();
        void router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};