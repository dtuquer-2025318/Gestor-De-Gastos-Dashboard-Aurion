import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionService } from '../services/session.service';

export const authGuard: CanActivateFn = () => {
  const sessionService = inject(SessionService);
  const router = inject(Router);

  // Verificar que el token existe Y no ha expirado
  if (sessionService.isTokenValid()) {
    return true;
  }

  // Si no hay token o está expirado, redirigir al login
  sessionService.clearExpirationTimer();
  router.navigate(['/login']);
  return false;
};