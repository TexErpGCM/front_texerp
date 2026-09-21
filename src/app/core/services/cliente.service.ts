import { Injectable, inject } from '@angular/core';
import {
  HttpClient,
  HttpParams
} from '@angular/common/http';
import { Observable } from 'rxjs';

export type TipoCliente = 'NATURAL' | 'JURIDICO';

export interface Cliente {
  id: number;
  document: string;
  name: string;
  type: string;
  email: string | null;
  phone: string | null;
  classification: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CrearClienteRequest {
  document: string;
  name: string;
  type: string;
  email?: string | null;
  phone?: string | null;
  classification?: string | null;
  active: boolean;
}

export interface CambiarEstadoClienteRequest {
  active: boolean;
}

export interface ClienteFiltros {
  document?: string;
  name?: string;
  type?: string;
  active?: boolean | null;
}

export interface ClientePage {
  content: Cliente[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class ClienteService {

  private readonly http = inject(HttpClient);

  private readonly apiUrl =
    '/api/v1/customers';

  listar(
    filtros: ClienteFiltros = {},
    page: number = 0,
    size: number = 20
  ): Observable<ApiResponse<ClientePage>> {

    let params = new HttpParams()
      .set('page', page)
      .set('size', size);

    if (filtros.document?.trim()) {
      params = params.set(
        'document',
        filtros.document.trim()
      );
    }

    if (filtros.name?.trim()) {
      params = params.set(
        'name',
        filtros.name.trim()
      );
    }

    if (filtros.type) {
      params = params.set(
        'type',
        filtros.type
      );
    }

    if (
      filtros.active !== null &&
      filtros.active !== undefined
    ) {
      params = params.set(
        'active',
        filtros.active
      );
    }

    return this.http.get<
      ApiResponse<ClientePage>
    >(
      this.apiUrl,
      { params }
    );
  }

  obtenerPorId(
    id: number
  ): Observable<ApiResponse<Cliente>> {

    return this.http.get<
      ApiResponse<Cliente>
    >(
      `${this.apiUrl}/${id}`
    );
  }

  crear(
    request: CrearClienteRequest
  ): Observable<ApiResponse<Cliente>> {

    return this.http.post<
      ApiResponse<Cliente>
    >(
      this.apiUrl,
      request
    );
  }

  actualizar(
    id: number,
    request: CrearClienteRequest
  ): Observable<ApiResponse<Cliente>> {

    return this.http.put<
      ApiResponse<Cliente>
    >(
      `${this.apiUrl}/${id}`,
      request
    );
  }

  cambiarEstado(
    id: number,
    active: boolean
  ): Observable<ApiResponse<Cliente>> {

    const request: CambiarEstadoClienteRequest = {
      active
    };

    return this.http.patch<
      ApiResponse<Cliente>
    >(
      `${this.apiUrl}/${id}/status`,
      request
    );
  }
}