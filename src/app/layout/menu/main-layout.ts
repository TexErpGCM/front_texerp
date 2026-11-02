import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { APP_PERMISSIONS, AppPermission, PermissionService } from '../../core/services/permission.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss'
})
export class MainLayout {
  private readonly authService = inject(AuthService);
  private readonly permissionService = inject(PermissionService);
  private readonly router = inject(Router);

  readonly P = APP_PERMISSIONS;

  get userName(): string {
    return this.authService.getName();
  }

  get userRole(): string {
    return this.authService.getRole() ?? 'SIN ROL';
  }

  can(permission: AppPermission): boolean {
    return this.permissionService.has(permission);
  }

  cerrarSesion(): void {
    this.authService.logout();
    void this.router.navigate(['/']);
  }
}
