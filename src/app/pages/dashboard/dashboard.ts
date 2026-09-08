import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class DashboardComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly name = this.auth.getName();
  readonly email = this.auth.getEmail();
  readonly role = this.auth.getRole() || 'SIN_ROL';

  cerrarSesion(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}