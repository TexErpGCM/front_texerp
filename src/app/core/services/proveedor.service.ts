import { Injectable, inject } from '@angular/core';
import {
  HttpClient,
  HttpParams
} from '@angular/common/http';
import { Observable } from 'rxjs';

import { ApiResponse } from './user.services';

export interface Proveedor {
  id: number;
  taxId: string;
  name: string;
  phone: string;
  email: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProveedorPage {
  content: Proveedor[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface CrearProveedorRequest {
  taxId: string;
  name: string;
  email: string;
}

export interface CambiarEstadoProveedorRequest {
  active: boolean;
}

export interface ProveedorFiltros {
  taxId?: string;
  name?: string;
  active?: boolean | null;
}

@Injectable({
  providedIn: 'root'
})
export class ProveedorService {

  private http = inject(HttpClient);

  private readonly apiUrl = '/api/v1/suppliers';

  listar(
    filtros: ProveedorFiltros = {},
    pagina: number = 0,
    tamanio: number = 20
  ): Observable<ApiResponse<ProveedorPage>> {

    let params = new HttpParams()
      .set('page', pagina)
      .set('size', tamanio);

    if (filtros.taxId?.trim()) {
      params = params.set(
        'taxId',
        filtros.taxId.trim()
      );
    }

    if (filtros.name?.trim()) {
      params = params.set(
        'name',
        filtros.name.trim()
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

    return this.http.get<ApiResponse<ProveedorPage>>(
      this.apiUrl,
      { params }
    );
  }

  obtenerPorId(
    id: number
  ): Observable<ApiResponse<Proveedor>> {

    return this.http.get<ApiResponse<Proveedor>>(
      `${this.apiUrl}/${id}`
    );
  }

  crear(
    request: CrearProveedorRequest
  ): Observable<ApiResponse<Proveedor>> {

    return this.http.post<ApiResponse<Proveedor>>(
      this.apiUrl,
      request
    );
  }

  actualizar(
    id: number,
    request: CrearProveedorRequest
  ): Observable<ApiResponse<Proveedor>> {

    return this.http.put<ApiResponse<Proveedor>>(
      `${this.apiUrl}/${id}`,
      request
    );
  }

  cambiarEstado(
    id: number,
    active: boolean
  ): Observable<ApiResponse<Proveedor>> {

    const request: CambiarEstadoProveedorRequest = {
      active
    };

    return this.http.patch<ApiResponse<Proveedor>>(
      `${this.apiUrl}/${id}/status`,
      request
    );
  }
}