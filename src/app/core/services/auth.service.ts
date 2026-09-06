import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface UserSession {
  userId?: number | string;
  name?: string;
  email: string;
  role: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  
  // Utiliza el archivo environment o cae a la URL local por defecto
  private readonly apiUrl = `${environment?.apiUrl || 'http://localhost:8080/api/v1'}/auth`;

  login(credentials: LoginRequest): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, credentials).pipe(
      tap((res) => {
        if (res) {
          this.saveSession(res);
        }
      })
    );
  }

  saveSession(response: any): void {
    // Normaliza la respuesta sea directa (res.token) o anidada (res.data.token)
    const data = response.data || response;

    const token = data.token;
    const user: UserSession = data.user || {
      userId: data.userId || data.id,
      name: data.name || 'Usuario',
      email: data.email || '',
      role: data.role || 'SIN_ROL'
    };

    // Guardar datos clave en localStorage
    if (token) localStorage.setItem('token', token);
    localStorage.setItem('tokenType', data.tokenType || 'Bearer');
    
    // Guardar el objeto 'user' completo (usado por el Dashboard)
    localStorage.setItem('user', JSON.stringify(user));

    // Guardar propiedades individuales como respaldo
    if (user.email) localStorage.setItem('email', user.email);
    if (user.role) localStorage.setItem('role', user.role);
    if (user.name) localStorage.setItem('name', user.name);
    if (user.userId) localStorage.setItem('userId', String(user.userId));
  }

  logout(): void {
    localStorage.clear();
    void this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getUser(): UserSession | null {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  getRole(): string | null {
    const user = this.getUser();
    return user?.role || localStorage.getItem('role') || null;
  }

  getName(): string {
    const user = this.getUser();
    return user?.name || localStorage.getItem('name') || 'Usuario';
  }

  getEmail(): string {
    const user = this.getUser();
    return user?.email || localStorage.getItem('email') || '';
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  hasRole(roles: string[]): boolean {
    const role = this.getRole();
    return !!role && roles.includes(role);
  }
}