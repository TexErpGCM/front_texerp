import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { LoginData, LoginRequest } from '../models/auth.model';
import { clearStoredSession, isTokenExpired, roleFromToken } from '../utils/session.util';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router,
  ) {}

  login(request: LoginRequest): Observable<ApiResponse<LoginData>> {
    return this.http
      .post<ApiResponse<LoginData>>(`${this.apiUrl}/login`, request)
      .pipe(tap(response => this.saveSession(response.data)));
  }

  logout(): void {
    clearStoredSession();
    void this.router.navigate(['/login']);
  }

  saveSession(data: LoginData): void {
    localStorage.setItem('token', data.token);
    localStorage.setItem('tokenType', data.tokenType || 'Bearer');
    localStorage.setItem('userId', String(data.userId));
    localStorage.setItem('name', data.name);
    localStorage.setItem('email', data.email);
    localStorage.setItem('role', data.role);
  }

  getToken(): string | null {
    const token = localStorage.getItem('token');
    if (!token) return null;

    if (isTokenExpired(token)) {
      clearStoredSession();
      return null;
    }

    return token;
  }

  getRole(): string | null {
    const token = this.getToken();
    return token ? roleFromToken(token) || localStorage.getItem('role') : null;
  }

  getName(): string {
    return localStorage.getItem('name') || 'Usuario';
  }

  getEmail(): string {
    return localStorage.getItem('email') || '';
  }

  isLoggedIn(): boolean {
    return this.getToken() !== null;
  }

  hasRole(roles: string[]): boolean {
    const role = this.getRole();
    return !!role && roles.includes(role);
  }
}
