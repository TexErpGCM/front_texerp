import { Injectable, inject } from '@angular/core';
import {
  HttpClient,
  HttpParams
} from '@angular/common/http';
import { Observable } from 'rxjs';

import { ApiResponse } from './user.services';

export interface Variante {
  id: number;
  productId: number;
  productCode: string;
  sku: string;
  color: string;
  pattern: string;
  width: number;
  unitCode: string;
  unitName: string;
  cost: number;
  salePrice: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
export interface Producto {
  id: number;
  name: string;
}

export interface ProductoPage {
  content: Producto[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface VariantePage {
  content: Variante[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface CrearVarianteRequest {
  sku: string;
  color: string;
  pattern: string;
  width: number;
  unitCode: string;
  cost: number;
  salePrice: number;
  active: boolean;
}

export interface ActualizarPrecioCostoRequest {
  cost: number;
  salePrice: number;
}

export interface ActualizarEstadoVarianteRequest {
  active: boolean;
}

export interface VarianteFiltros {
  productId?: number;
  sku?: string;
  color?: string;
  active?: boolean;
  page?: number;
  size?: number;
}

@Injectable({
  providedIn: 'root'
})
export class VarianteproductoService {

  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/v1';

  obtenerVariantes(
    filtros: VarianteFiltros = {}
  ): Observable<ApiResponse<VariantePage>> {

    let params = new HttpParams()
      .set('page', filtros.page ?? 0)
      .set('size', filtros.size ?? 20);

    if (filtros.productId !== undefined) {
      params = params.set('productId', filtros.productId);
    }

    if (filtros.sku?.trim()) {
      params = params.set('sku', filtros.sku.trim());
    }

    if (filtros.color?.trim()) {
      params = params.set('color', filtros.color.trim());
    }

    if (filtros.active !== undefined) {
      params = params.set('active', filtros.active);
    }

    return this.http.get<ApiResponse<VariantePage>>(
      `${this.apiUrl}/variants`,
      { params }
    );
  }

  obtenerVariante(
    id: number
  ): Observable<ApiResponse<Variante>> {

    return this.http.get<ApiResponse<Variante>>(
      `${this.apiUrl}/variants/${id}`
    );
  }

  crearVariante(
    productId: number,
    request: CrearVarianteRequest
  ): Observable<ApiResponse<Variante>> {

    return this.http.post<ApiResponse<Variante>>(
      `${this.apiUrl}/products/${productId}/variants`,
      request
    );
  }

  actualizarVariante(
    id: number,
    request: CrearVarianteRequest
  ): Observable<ApiResponse<Variante>> {

    return this.http.put<ApiResponse<Variante>>(
      `${this.apiUrl}/variants/${id}`,
      request
    );
  }

  actualizarPrecioCosto(
    id: number,
    request: ActualizarPrecioCostoRequest
  ): Observable<ApiResponse<Variante>> {

    return this.http.patch<ApiResponse<Variante>>(
      `${this.apiUrl}/variants/${id}/price-cost`,
      request
    );
  }

  actualizarEstado(
    id: number,
    active: boolean
  ): Observable<ApiResponse<Variante>> {

    const request: ActualizarEstadoVarianteRequest = {
      active
    };

    return this.http.patch<ApiResponse<Variante>>(
      `${this.apiUrl}/variants/${id}/status`,
      request
    );
  }

 
}