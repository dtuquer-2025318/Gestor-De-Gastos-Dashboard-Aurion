import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { SessionService } from '../../core/services/session.service';
import { User } from '../../core/models/auth.model';
import { Subscription } from 'rxjs';

/* ─── Interfaces ─── */
interface StatCard {
  title: string;
  value: string;
  icon: string;
}

interface BarGroup {
  label: string;
  blue: number;
  purple: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  /* ─── Servicios ─── */
  private authService = inject(AuthService);
  private sessionService = inject(SessionService);
  private router = inject(Router);

  /* ─── Estado de usuario ─── */
  currentUser = this.authService.currentUser;

  profileUser: User | null = null;
  profileLoading = false;
  profileError = '';
  private profileSub?: Subscription;

  /* ─── Sidebar móvil ─── */
  sidebarOpen = false;

  /* ─── Modal de confirmación de logout ─── */
  showLogoutModal = signal(false);

  /* ─── Fecha / Hora ─── */
  currentDate = new Date().toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  currentTime = new Date().toLocaleTimeString('es-ES', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  /* ─── Tarjetas de estadísticas ─── */
  stats: StatCard[] = [
    { title: 'SALDO TOTAL',     value: 'Q. 12,000', icon: '/icons/saldo.png' },
    { title: 'GASTOS TOTALES',  value: 'Q. 14,357', icon: '/icons/gastos.png' },
    { title: 'AHORROS TOTALES', value: 'Q. 1,000',  icon: '/icons/ahorros.png' }
  ];

  /* ─── Datos del gráfico de barras ─── */
  barData: BarGroup[] = [
    { label: 'Ene', blue: 4000, purple: 2500 },
    { label: 'Feb', blue: 3200, purple: 1700 },
    { label: 'Mar', blue: 2200, purple: 1200 }
  ];

  /* ─── Ciclo de vida ─── */
  ngOnInit(): void {
    this.loadProfile();
  }

  ngOnDestroy(): void {
    this.profileSub?.unsubscribe();
  }

  /* ─── Métodos ─── */
  private loadProfile(): void {
    this.profileLoading = true;
    this.profileError = '';

    this.profileSub = this.authService.getProfile().subscribe({
      next: (res) => {
        this.profileUser = res.user;
        this.profileLoading = false;
      },
      error: (err) => {
        this.profileLoading = false;
        this.profileError = err.error?.message || 'No se pudo cargar el perfil.';
      }
    });
  }

  /**
   * Devuelve el nombre legible del rol según el enum del backend.
   * ADMIN → 'Admin' | USER → 'Usuario'
   */
  get userRoleLabel(): string {
    const role = this.currentUser()?.role;
    return role === 'ADMIN' ? 'Admin' : 'Usuario';
  }

  /* ─── Modal de logout ─── */
  openLogoutModal(): void {
    this.showLogoutModal.set(true);
  }

  closeLogoutModal(): void {
    this.showLogoutModal.set(false);
  }

  confirmLogout(): void {
    this.showLogoutModal.set(false);
    this.authService.logout();
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeLogoutModal();
    }
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }
}