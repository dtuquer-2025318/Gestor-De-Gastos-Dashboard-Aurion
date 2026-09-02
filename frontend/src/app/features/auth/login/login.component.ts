import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);

  loginForm!: FormGroup;
  errorMessage = '';
  successMessage = '';
  sessionExpiredMessage = '';
  inactivityExpiredMessage = '';
  idleExpiredMessage = ''; // <-- NUEVO
  loading = false;

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });

    this.route.queryParams.subscribe((params) => {
      if (params['registered'] === 'true') {
        this.successMessage = 'Registro exitoso. Por favor inicie sesión con sus credenciales.';
      }
      if (params['sessionExpired'] === 'true') {
        this.sessionExpiredMessage = 'La sesión ha expirado. Por favor inicie sesión nuevamente.';
      }
      if (params['inactivityExpired'] === 'true') {
        this.inactivityExpiredMessage = 'Su sesión se cerró por inactividad. Por favor inicie sesión nuevamente.';
      }
      if (params['idleExpired'] === 'true') { // <-- NUEVO
        this.idleExpiredMessage = 'Su sesión se cerró por inactividad. No se detectó interacción durante un tiempo prolongado.';
      }
    });
  }

  get f() {
    return this.loginForm.controls;
  }

  onSubmit(): void {
    this.loginForm.markAllAsTouched();

    if (this.loginForm.invalid) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.sessionExpiredMessage = '';
    this.inactivityExpiredMessage = '';
    this.idleExpiredMessage = ''; // <-- NUEVO: limpiar al intentar login

    this.loginForm.disable();

    this.authService.login(this.loginForm.getRawValue()).subscribe({
      next: () => {
        this.loading = false;
        this.loginForm.enable();
        this.router.navigate(['/dashboard']);
      },
      error: (err: HttpErrorResponse) => {
        this.loading = false;
        this.loginForm.enable();
        
        if (err.status === 401) {
          this.errorMessage = 'Credenciales incorrectas. Verifique su correo electrónico y contraseña.';
        } else if (err.status === 429) {
          this.errorMessage = 'Demasiados intentos. Por favor espere unos minutos.';
        } else if (err.status === 0) {
          this.errorMessage = 'No se pudo conectar con el servidor. Verifique su conexión a internet.';
        } else {
          this.errorMessage = err.error?.message || 'Ocurrió un error inesperado. Intente más tarde.';
        }
      }
    });
  }

  goToRegister(): void {
    this.router.navigate(['/register']);
  }
}