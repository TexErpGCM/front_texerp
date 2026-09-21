import { Injectable, inject } from '@angular/core';
import {
  HttpClient,
  HttpParams
} from '@angular/common/http';
import { Observable } from 'rxjs';

import { ApiResponse } from './user.services';

export interface Bodega {
  id: number;
  code: string;
  name: string;
  location: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BodegaPage {
  content: Bodega[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface CrearBodegaRequest {
  code: string;
  name: string;
  location: string;
}

export interface CambiarEstadoBodegaRequest {
  active: boolean;
}

export interface BodegaFiltros {
  code?: string;
  name?: string;
  location?: string;
  active?: boolean | null;
}

@Injectable({
  providedIn: 'root'
})
export class BodegaService {

  private http = inject(HttpClient);

  private readonly apiUrl = '/api/v1/warehouses';

  listar(
    filtros: BodegaFiltros = {},
    pagina: number = 0,
    tamanio: number = 20
  ): Observable<ApiResponse<BodegaPage>> {

    let params = new HttpParams()
      .set('page', pagina)
      .set('size', tamanio);

    if (filtros.code?.trim()) {
      params = params.set('code', filtros.code.trim());
    }

    if (filtros.name?.trim()) {
      params = params.set('name', filtros.name.trim());
    }

    if (filtros.location?.trim()) {
      params = params.set('location', filtros.location.trim());
    }

    if (filtros.active !== null && filtros.active !== undefined) {
      params = params.set('active', filtros.active);
    }

    return this.http.get<ApiResponse<BodegaPage>>(
      this.apiUrl,
      { params }
    );
  }

  obtenerPorId(id: number): Observable<ApiResponse<Bodega>> {
    return this.http.get<ApiResponse<Bodega>>(
      `${this.apiUrl}/${id}`
    );
  }

  crear(
    request: CrearBodegaRequest
  ): Observable<ApiResponse<Bodega>> {
    return this.http.post<ApiResponse<Bodega>>(
      this.apiUrl,
      request
    );
  }

  actualizar(
    id: number,
    request: CrearBodegaRequest
  ): Observable<ApiResponse<Bodega>> {
    return this.http.put<ApiResponse<Bodega>>(
      `${this.apiUrl}/${id}`,
      request
    );
  }

  cambiarEstado(
    id: number,
    active: boolean
  ): Observable<ApiResponse<Bodega>> {

    const request: CambiarEstadoBodegaRequest = {
      active
    };

    return this.http.patch<ApiResponse<Bodega>>(
      `${this.apiUrl}/${id}/status`,
      request
    );
  }
}