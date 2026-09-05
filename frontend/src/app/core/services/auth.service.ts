import { Injectable, inject, signal, PLATFORM_ID, DestroyRef } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, EMPTY } from 'rxjs';
import { AuthResponse, LoginDTO, RegisterDTO, User, RegisterResponse } from '../models/auth.model';
import { Router } from '@angular/router';
import { SessionService } from './session.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  private sessionService = inject(SessionService);
  private destroyRef = inject(DestroyRef);
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  /** Signal reactivo con el usuario en memoria */
  currentUser = signal<User | null>(null);

  constructor() {
    // Suscripción a eventos de cierre de sesión por inactividad/expiración
    this.sessionService.sessionExpired$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.logoutDueToExpiration());

    this.sessionService.inactivityExpired$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.logoutDueToInactivity());

    this.sessionService.idleExpired$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.logoutDueToIdle());

    // Inicializar sesión si existe token en el navegador al recargar
    this.initSessionOnLoad();
  }

  private initSessionOnLoad(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const token = this.getToken();
    if (token && this.sessionService.isTokenValid()) {
      // Iniciar contadores de inactividad
      this.sessionService.startSessionMonitoring();

      // Cargar perfil en segundo plano sin destruir la sesión si hay error temporal
      this.getProfile().pipe(
        catchError(() => {
          // Si el backend responde explícitamente 401, el authInterceptor se encargará de redirigir.
          // Evitamos llamar a clearAuthData() prematuramente aquí para evitar expulsiones por fallos de red.
          return EMPTY;
        })
      ).subscribe({
        next: (res) => this.currentUser.set(res.user),
      });
    }
  }

  login(credentials: LoginDTO): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap((res) => {
        this.handleSuccessAuth(res);
        this.sessionService.startSessionMonitoring();
      })
    );
  }

  register(data: RegisterDTO): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.apiUrl}/register`, data);
  }

  getProfile(): Observable<{ success: boolean; user: User }> {
    return this.http.get<{ success: boolean; user: User }>(`${this.apiUrl}/me`);
  }

  logout(): void {
    this.sessionService.clearExpirationTimer();
    this.clearAuthData();
    this.router.navigate(['/login']);
  }

  private logoutDueToExpiration(): void {
    this.clearAuthData();
    this.router.navigate(['/login'], {
      queryParams: { sessionExpired: 'true' },
      replaceUrl: true,
    });
  }

  private logoutDueToInactivity(): void {
    this.clearAuthData();
    this.router.navigate(['/login'], {
      queryParams: { inactivityExpired: 'true' },
      replaceUrl: true,
    });
  }

  private logoutDueToIdle(): void {
    this.clearAuthData();
    this.router.navigate(['/login'], {
      queryParams: { idleExpired: 'true' },
      replaceUrl: true,
    });
  }

  clearAuthData(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    this.currentUser.set(null);
  }

  getToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('token');
    }
    return null;
  }

  private handleSuccessAuth(res: AuthResponse): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('token', res.token);
    }
    this.currentUser.set(res.user);
  }
}