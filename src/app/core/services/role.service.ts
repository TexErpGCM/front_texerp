import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp?: string;
}

export interface PermissionInfo {
  code: string;
  module: string;
  description: string;
}

export interface RoleSummary {
  id: number;
  name: string;
  description: string | null;
  systemRole: boolean;
}

export interface RoleResponse extends RoleSummary {
  permissions: string[];
  activeUsers: number;
}

export interface RoleRequest {
  name: string;
  description: string | null;
  permissions: string[];
}

@Injectable({ providedIn: 'root' })
export class RoleService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/v1/roles';

  listar(): Observable<ApiResponse<RoleResponse[]>> {
    return this.http.get<ApiResponse<RoleResponse[]>>(this.apiUrl);
  }

  permisos(): Observable<ApiResponse<PermissionInfo[]>> {
    return this.http.get<ApiResponse<PermissionInfo[]>>(`${this.apiUrl}/permissions`);
  }

  crear(request: RoleRequest): Observable<ApiResponse<RoleResponse>> {
    return this.http.post<ApiResponse<RoleResponse>>(this.apiUrl, request);
  }

  actualizar(id: number, request: RoleRequest): Observable<ApiResponse<RoleResponse>> {
    return this.http.put<ApiResponse<RoleResponse>>(`${this.apiUrl}/${id}`, request);
  }

  eliminar(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }
}
