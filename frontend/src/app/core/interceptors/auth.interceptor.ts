import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { SessionService } from '../services/session.service';
import { Router } from '@angular/router';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const sessionService = inject(SessionService);
  const router = inject(Router);

  const token = authService.getToken();

  const authReq = token
    ? req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // Usar el método centralizado de AuthService para mantener consistencia
        sessionService.clearExpirationTimer();
        authService.clearAuthData();
        
        router.navigate(['/login'], {
          queryParams: { sessionExpired: 'true' },
          replaceUrl: true,
        });
      }

      return throwError(() => error);
    })
  );
};