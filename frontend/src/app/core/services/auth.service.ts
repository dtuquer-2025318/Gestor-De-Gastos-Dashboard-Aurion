import { Injectable, inject, signal, PLATFORM_ID, DestroyRef } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
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

  /** Signal reactivo con el usuario autenticado actualmente */
  currentUser = signal<User | null>(this.getUserFromStorage());

  constructor() {
    this.sessionService.sessionExpired$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.logoutDueToExpiration();
      });
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

  /**
   * Logout explícito iniciado por el usuario.
   * Limpia datos y redirige al login.
   */
  logout(): void {
    this.sessionService.clearExpirationTimer();
    this.clearAuthData();
    this.router.navigate(['/login']);
  }

  /**
   * Logout automático por expiración de sesión.
   * Separamos la lógica para poder añadir métricas o logging diferenciado.
   */
  private logoutDueToExpiration(): void {
    this.clearAuthData();
    this.router.navigate(['/login'], {
      queryParams: { sessionExpired: 'true' },
      replaceUrl: true,
    });
  }

  /**
   * Limpia TODOS los datos de autenticación del cliente.
   * Única fuente de verdad para el cleanup — evita inconsistencias.
   */
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
      localStorage.setItem('user', JSON.stringify(res.user));
    }
    this.currentUser.set(res.user);
  }

  private getUserFromStorage(): User | null {
    if (isPlatformBrowser(this.platformId)) {
      const userStr = localStorage.getItem('user');
      if (!userStr) return null;
      try {
        return JSON.parse(userStr) as User;
      } catch {
        // Si el JSON está corrupto, limpiamos para evitar errores persistentes
        this.clearAuthData();
        return null;
      }
    }
    return null;
  }
}