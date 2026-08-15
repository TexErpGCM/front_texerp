import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  cargando = false;
  mostrarContrasena = false;
  mensajeError = '';

  get emailInvalido(): boolean {
    const control = this.form.controls.email;
    return control.invalid && (control.dirty || control.touched);
  }

  get passwordInvalido(): boolean {
    const control = this.form.controls.password;
    return control.invalid && (control.dirty || control.touched);
  }

  alternarContrasena(): void {
    this.mostrarContrasena = !this.mostrarContrasena;
  }

  ingresar(): void {
    this.mensajeError = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.cargando = true;

    this.authService
      .login(this.form.getRawValue())
      .pipe(finalize(() => (this.cargando = false)))
      .subscribe({
        next: () => void this.router.navigate(['/dashboard']),
        error: (error: HttpErrorResponse) => {
          this.mensajeError = this.obtenerMensajeError(error);
        },
      });
  }

  private obtenerMensajeError(error: HttpErrorResponse): string {
    switch (error.status) {
      case 0:
        return 'No fue posible conectarse con TexERP. Verifica tu conexión e inténtalo nuevamente.';
      case 401:
        return 'El correo o la contraseña son incorrectos.';
      case 403:
        return 'Tu usuario no tiene permiso para ingresar a TexERP.';
      case 429:
        return 'Se realizaron demasiados intentos. Inténtalo nuevamente más tarde.';
      default:
        return 'Ocurrió un problema al iniciar sesión. Inténtalo nuevamente.';
    }
  }
}
