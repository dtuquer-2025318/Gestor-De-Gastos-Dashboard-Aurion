import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

/**
 * Lista de contraseñas comunes prohibidas (debe coincidir con el backend).
 */
const COMMON_PASSWORDS = [
  '123456',
  'password',
  'qwerty',
  '111111',
  '12345678',
  'abc123',
  'password123',
  '123456789',
  '1234567890',
  'admin',
  'aurion',
];

/**
 * Validador custom que verifica seguridad de la contraseña.
 * Retorna un único error 'weakPassword' con el mensaje apropiado.
 * NUNCA devuelve múltiples errores simultáneos.
 */
export function passwordStrengthValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as string;
    if (!value) return null;

    // 1. ¿Está en la lista de contraseñas comunes?
    if (COMMON_PASSWORDS.includes(value.toLowerCase())) {
      return {
        weakPassword: 'Tu contraseña es muy débil. Usa una combinación de letras y números.',
      };
    }

    // 2. ¿Es solo números? (ej: 12345678, 11111111)
    if (/^\d+$/.test(value)) {
      return {
        weakPassword: 'Tu contraseña es muy débil. Usa una combinación de letras y números.',
      };
    }

    // 3. ¿Cumple complejidad mínima? (mayúscula, minúscula, número, símbolo)
    const hasUpper = /[A-Z]/.test(value);
    const hasLower = /[a-z]/.test(value);
    const hasNumber = /[0-9]/.test(value);
    const hasSymbol = /[^A-Za-z0-9]/.test(value);

    if (!hasUpper || !hasLower || !hasNumber || !hasSymbol) {
      return {
        weakPassword: 'Usa solo letras, números o signos de puntuación comunes.',
      };
    }

    return null;
  };
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
})
export class RegisterComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  /** Formulario reactivo de registro */
  registerForm!: FormGroup;

  /** Mensajes de feedback */
  errorMessage = '';
  loading = false;

  ngOnInit(): void {
    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.maxLength(128),
          passwordStrengthValidator(),
        ],
      ],
    });
  }

  get f() {
    return this.registerForm.controls;
  }

  /**
   * Devuelve UN SOLO mensaje de error para el campo contraseña.
   * Prioridad: required → minlength → maxlength → weakPassword.
   * Esto garantiza que NUNCA se muestren dos mensajes al mismo tiempo.
   */
  get passwordErrorMessage(): string {
    const ctrl = this.f['password'];
    if (!ctrl || !ctrl.errors || !ctrl.touched) return '';

    if (ctrl.errors['required']) return 'La contraseña es obligatoria.';
    if (ctrl.errors['minlength']) return 'La contraseña debe tener al menos 8 caracteres.';
    if (ctrl.errors['maxlength']) return 'La contraseña no puede exceder 128 caracteres.';
    if (ctrl.errors['weakPassword']) return ctrl.errors['weakPassword'] as string;

    return '';
  }

  onSubmit(): void {
    this.registerForm.markAllAsTouched();

    if (this.registerForm.invalid) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    // Deshabilitar el formulario durante la petición
    this.registerForm.disable();

    this.authService.register(this.registerForm.getRawValue()).subscribe({
      next: () => {
        this.loading = false;
        this.registerForm.enable();
        this.router.navigate(['/login'], {
          queryParams: { registered: 'true' },
          replaceUrl: true,
        });
      },
      error: (err: any) => {
        this.loading = false;
        this.registerForm.enable();
        this.errorMessage = err.error?.message || 'Error al procesar la solicitud.';
      },
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}