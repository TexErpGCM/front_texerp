import { Component, inject } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  private readonly auth = inject(AuthService);

  readonly name = this.auth.getName();
  readonly email = this.auth.getEmail();
  readonly role = this.auth.getRole() || 'SIN_ROL';

  cerrarSesion(): void {
    this.auth.logout();
  }
}
