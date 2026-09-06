import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';


export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface Usuario {
  id: number;
  name: string;
  username: string;
  email: string;
  role: string;
  active: boolean;
}


export interface CrearUsuarioRequest {
  name: string;
  username: string;
  email: string;
  password: string;
  role: string;
  active: boolean;
}



export interface ActualizarUsuarioRequest {
  name: string;
  username: string;
  email: string;
  role: string;
}

export interface ActualizarEstadoRequest {
  active: boolean;
}


export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
  empty: boolean;
}



export interface UsuarioFiltros {
  page?: number;
  size?: number;
  name?: string;
  email?: string;
  role?: string;
  active?: boolean;
}


@Injectable({
  providedIn: 'root'
})
export class UserService {

  private readonly http = inject(HttpClient);

  private readonly apiUrl =
    '/api/v1/users';

  obtenerUsuarios(
    filtros: UsuarioFiltros = {}
  ): Observable<ApiResponse<Page<Usuario>>> {

    let params = new HttpParams();

    params = params.set(
      'page',
      filtros.page ?? 0
    );

    params = params.set(
      'size',
      filtros.size ?? 10
    );

    if (filtros.name?.trim()) {
      params = params.set(
        'name',
        filtros.name.trim()
      );

    }

    if (filtros.email?.trim()) {
      params = params.set(
        'email',
        filtros.email.trim()
      );

    }

    if (filtros.role) {
      params = params.set(
        'role',
        filtros.role
      );

    }

    if (filtros.active !== undefined) {
      params = params.set(
        'active',
        filtros.active
      );

    }

    return this.http.get<
      ApiResponse<Page<Usuario>>
    >(
      this.apiUrl,
      { params }
    );
  }


  obtenerUsuario(
    id: number
  ): Observable<ApiResponse<Usuario>> {

    return this.http.get<
      ApiResponse<Usuario>
    >(
      `${this.apiUrl}/${id}`
    );
  }


  crearUsuario(
    request: CrearUsuarioRequest
  ): Observable<ApiResponse<Usuario>> {

    return this.http.post<
      ApiResponse<Usuario>
    >(
      this.apiUrl,
      request
    );
  }

  actualizarUsuario(
    id: number,
    request: ActualizarUsuarioRequest
  ): Observable<ApiResponse<Usuario>> {

    return this.http.put<
      ApiResponse<Usuario>
    >(
      `${this.apiUrl}/${id}`,
      request
    );
  }

  actualizarEstado(
    id: number,
    active: boolean
  ): Observable<ApiResponse<Usuario>> {

    const request: ActualizarEstadoRequest = {
      active
    };

    return this.http.patch<
      ApiResponse<Usuario>
    >(
      `${this.apiUrl}/${id}/status`,
      request
    );
  }

  eliminarUsuario(id: number): Observable<ApiResponse<void>> {
  return this.http.delete<ApiResponse<void>>(
    `${this.apiUrl}/${id}`
  );
}

}