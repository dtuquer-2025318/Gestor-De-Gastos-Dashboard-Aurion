import { Injectable, inject, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { jwtDecode } from 'jwt-decode';
import { Subject } from 'rxjs';

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
export class SessionService {
  private platformId = inject(PLATFORM_ID);

  sessionExpired$ = new Subject<void>();

  private expirationTimerId: ReturnType<typeof setTimeout> | null = null;

  isSessionActive = signal<boolean>(false);

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

      this.expirationTimerId = setTimeout(() => {
        this.handleSessionExpired();
      }, timeUntilExpiration);
    } catch {
      // Silenciamos el error en producción; en dev podría loguearse
      this.sessionExpired$.next();
    }
  }

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

  clearExpirationTimer(): void {
    if (this.expirationTimerId) {
      clearTimeout(this.expirationTimerId);
      this.expirationTimerId = null;
    }
    this.isSessionActive.set(false);
  }

  private handleSessionExpired(): void {
    this.clearExpirationTimer();
    this.sessionExpired$.next();
  }

  private getTokenFromStorage(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('token');
    }
    return null;
  }
}