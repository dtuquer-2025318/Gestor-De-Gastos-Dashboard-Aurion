import { Injectable, inject, PLATFORM_ID, signal, OnDestroy } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { jwtDecode } from 'jwt-decode';
import { Subject } from 'rxjs';
import { environment } from '../../../environments/environment';

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

@Injectable({
  providedIn: 'root',
})
export class SessionService implements OnDestroy {
  private platformId = inject(PLATFORM_ID);

  /** Evento que se emite cuando la sesión expira automáticamente por JWT */
  sessionExpired$ = new Subject<void>();

  /** Evento que se emite cuando la sesión se cierra por inactividad (pestaña oculta) */
  inactivityExpired$ = new Subject<void>();

  /** ID del timer de expiración JWT */
  private expirationTimerId: ReturnType<typeof setTimeout> | null = null;

  /** ID del timer de inactividad (pestaña oculta) */
  private inactivityTimerId: ReturnType<typeof setTimeout> | null = null;

  /** Handler referenciado para poder remover el listener de visibilidad */
  private visibilityHandler = () => this.onVisibilityChange();

  /** Signal que indica si la sesión está activa y vigente */
  isSessionActive = signal<boolean>(false);

  /** Tiempo límite de inactividad en milisegundos (configurable vía environment) */
  private readonly INACTIVITY_LIMIT_MS = (environment.inactivityTimeoutMinutes || 2) * 60 * 1000;

  /**
   * Inicia el monitoreo de expiración JWT y el listener de visibilidad de pestaña.
   * Se llama desde AuthService cada vez que el usuario inicia sesión.
   */
  startSessionMonitoring(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.clearExpirationTimer();

    const token = this.getTokenFromStorage();
    if (!token) {
      this.isSessionActive.set(false);
      return;
    }

    try {
      const decoded = jwtDecode<JwtPayload>(token);
      const expirationTimeMs = decoded.exp * 1000;
      const nowMs = Date.now();
      const timeUntilExpiration = expirationTimeMs - nowMs;

      if (timeUntilExpiration <= 0) {
        this.handleSessionExpired();
        return;
      }

      this.isSessionActive.set(true);

      // Timer de expiración JWT (el que ya existía)
      this.expirationTimerId = setTimeout(() => {
        this.handleSessionExpired();
      }, timeUntilExpiration);

      // Registrar listener de visibilidad (evitar duplicados removiendo primero)
      this.stopVisibilityListener();
      document.addEventListener('visibilitychange', this.visibilityHandler);

      // Si la pestaña ya está oculta al iniciar sesión, arrancar timer de inactividad
      if (document.hidden) {
        this.startInactivityTimer();
      }
    } catch {
      this.sessionExpired$.next();
    }
  }

  /**
   * Verifica manualmente si el token actual está vigente.
   */
  isTokenValid(): boolean {
    if (!isPlatformBrowser(this.platformId)) {
      return false;
    }

    const token = this.getTokenFromStorage();
    if (!token) {
      return false;
    }

    try {
      const decoded = jwtDecode<JwtPayload>(token);
      const expirationTimeMs = decoded.exp * 1000;
      return Date.now() < expirationTimeMs;
    } catch {
      return false;
    }
  }

  /**
   * Obtiene el tiempo restante de la sesión en milisegundos.
   */
  getTimeUntilExpiration(): number {
    if (!isPlatformBrowser(this.platformId)) {
      return 0;
    }

    const token = this.getTokenFromStorage();
    if (!token) {
      return 0;
    }

    try {
      const decoded = jwtDecode<JwtPayload>(token);
      const expirationTimeMs = decoded.exp * 1000;
      const remaining = expirationTimeMs - Date.now();
      return remaining > 0 ? remaining : 0;
    } catch {
      return 0;
    }
  }

  /**
   * Limpia todos los timers y listeners. Se llama al hacer logout o destruir el servicio.
   */
  clearExpirationTimer(): void {
    if (this.expirationTimerId) {
      clearTimeout(this.expirationTimerId);
      this.expirationTimerId = null;
    }
    this.stopInactivityTimer();
    this.stopVisibilityListener();
    this.isSessionActive.set(false);
  }

  /**
   * Maneja la expiración automática por JWT.
   */
  private handleSessionExpired(): void {
    this.clearExpirationTimer();
    this.sessionExpired$.next();
  }

  /**
   * Maneja la expiración por inactividad (pestaña oculta demasiado tiempo).
   */
  private handleInactivityExpired(): void {
    this.clearExpirationTimer();
    this.inactivityExpired$.next();
  }

  /**
   * Se ejecuta cada vez que cambia la visibilidad de la pestaña.
   * document.hidden === true  → usuario salió (minimizó, cambió tab, etc.)
   * document.hidden === false → usuario volvió
   */
  private onVisibilityChange(): void {
    if (document.hidden) {
      // El usuario salió de la pestaña → iniciar conteo de inactividad
      this.startInactivityTimer();
    } else {
      // El usuario volvió a la pestaña → detener conteo de inactividad
      this.stopInactivityTimer();

      // Si la sesión fue cerrada mientras estaba fuera (token ya no existe o expiró),
      // notificar para redirigir al login con mensaje específico
      if (!this.isTokenValid()) {
        this.inactivityExpired$.next();
      }
    }
  }

  /**
   * Inicia el timer de inactividad. Solo se llama cuando document.hidden === true.
   * Si el usuario no vuelve antes de INACTIVITY_LIMIT_MS, se cierra sesión.
   */
  private startInactivityTimer(): void {
    this.stopInactivityTimer(); // evitar timers duplicados si cambia varias veces

    this.inactivityTimerId = setTimeout(() => {
      this.handleInactivityExpired();
    }, this.INACTIVITY_LIMIT_MS);
  }

  /**
   * Detiene el timer de inactividad sin cerrar sesión.
   * Se llama cuando el usuario vuelve a la pestaña a tiempo.
   */
  private stopInactivityTimer(): void {
    if (this.inactivityTimerId) {
      clearTimeout(this.inactivityTimerId);
      this.inactivityTimerId = null;
    }
  }

  /**
   * Remueve el listener de visibilidad para evitar fugas de memoria.
   */
  private stopVisibilityListener(): void {
    document.removeEventListener('visibilitychange', this.visibilityHandler);
  }

  /**
   * Lee el token directamente de localStorage.
   */
  private getTokenFromStorage(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('token');
    }
    return null;
  }

  ngOnDestroy(): void {
    this.clearExpirationTimer();
  }
}