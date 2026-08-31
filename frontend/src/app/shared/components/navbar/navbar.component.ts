import { Component, inject, HostListener, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  @ViewChild('userMenu') userMenu!: ElementRef;

  currentUser = this.authService.currentUser;

  menuOpen = false;
  dropdownOpen = false;

  getInitials(): string {
    const name = this.currentUser()?.name || '';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase() || 'U';
  }

  logout(): void {
    this.authService.logout();
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.userMenu && !this.userMenu.nativeElement.contains(event.target)) {
      this.dropdownOpen = false;
    }
  }
}
