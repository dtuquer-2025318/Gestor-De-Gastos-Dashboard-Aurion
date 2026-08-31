import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
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
      password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(128)]],
    });
  }

  get f() {
    return this.registerForm.controls;
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
      }
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
