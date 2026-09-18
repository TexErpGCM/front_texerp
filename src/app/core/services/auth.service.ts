import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface UserSession {
  userId?: number | string;
  name: string;
  email: string;
  role: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  
  private readonly apiUrl = 'http://localhost:8080/api/v1/auth';

  login(credentials: LoginRequest): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, credentials).pipe(
      tap((res) => {
        if (res) {
          this.saveSession(res);
        }
      })
    );
  }

  saveSession(data: any): void {
    if (!data) return;

    // Normaliza el objeto si viene envuelto en una propiedad 'data'
    const payload = data.data || data;

    // 1. Extrae el token de autenticación
    const token = 
      payload.token || 
      payload.accessToken || 
      payload.jwt || 
      payload.bearerToken || 
      data.token || 
      '';

    if (!token) {
      console.error('El backend no retornó un token válido:', data);
      return;
    }

    // 2. Extrae la información del usuario (soporta inglés y español)
    const userObj = payload.user || payload.usuario || payload;

    const userId = userObj.userId ?? userObj.id ?? userObj.idUsuario;
    const name = userObj.name || userObj.nombre || userObj.username || 'Usuario';
    const email = userObj.email || userObj.correo || userObj.username || '';
    
    let rawRole = userObj.role || userObj.rol || userObj.roles?.[0] || userObj.authorities?.[0]?.authority || 'ADMINISTRADOR';
    if (typeof rawRole === 'object' && rawRole?.name) {
      rawRole = rawRole.name;
    }
    const cleanRole = String(rawRole).replace(/^ROLE_/, '').toUpperCase();

    // 3. Persistencia en localStorage
    localStorage.setItem('token', token);
    localStorage.setItem('tokenType', payload.tokenType || 'Bearer');
    if (userId !== undefined && userId !== null) localStorage.setItem('userId', String(userId));
    localStorage.setItem('name', name);
    localStorage.setItem('email', email);
    localStorage.setItem('role', cleanRole);

    // 4. Guarda el objeto JSON estructurado para el Dashboard
    const userSession: UserSession = {
      userId: userId ?? undefined,
      name,
      email,
      role: cleanRole
    };
    
    localStorage.setItem('user', JSON.stringify(userSession));
  }

  logout(): void {
    this.clearStoredSession();
    void this.router.navigate(['/login']);
  }

  private clearStoredSession(): void {
    localStorage.clear();
  }

  getToken(): string | null {
    const token = localStorage.getItem('token');
    return token && token !== 'undefined' && token !== 'null' && token.trim() !== '' ? token : null;
  }

  getUser(): UserSession | null {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const parsed = JSON.parse(userStr);
        if (parsed && typeof parsed === 'object') return parsed as UserSession;
      } catch {
        // En caso de error al deserializar, pasa al fallback
      }
    }

    // Fallback con claves individuales
    const token = this.getToken();
    if (!token) return null;

    return {
      userId: localStorage.getItem('userId') || undefined,
      name: localStorage.getItem('name') || 'Usuario',
      email: localStorage.getItem('email') || '',
      role: localStorage.getItem('role') || 'ADMINISTRADOR'
    };
  }

  getRole(): string | null {
    return this.getUser()?.role || localStorage.getItem('role') || null;
  }

  getName(): string {
    return this.getUser()?.name || localStorage.getItem('name') || 'Usuario';
  }

  getEmail(): string {
    return this.getUser()?.email || localStorage.getItem('email') || '';
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  hasRole(roles: string[]): boolean {
    const currentRole = this.getRole();
    if (!currentRole) return false;
    const normalizedRoles = roles.map(r => r.toUpperCase().replace(/^ROLE_/, ''));
    return normalizedRoles.includes(currentRole.toUpperCase());
  }
}