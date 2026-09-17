import { Injectable, inject } from '@angular/core';
import {
  HttpClient,
  HttpParams
} from '@angular/common/http';

import {
  Observable,
  map
} from 'rxjs';

import { ApiResponse } from './user.services';


/**
 * Producto completo retornado por el backend.
 */
export interface Producto {
  id: number;
  code: string;
  name: string;
  fabricType: string;
  composition: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}


/**
 * Producto utilizado únicamente en selectores y filtros.
 *
 * Se mantiene reducido para no llevar información
 * innecesaria al componente.
 */
export interface ProductoSelector {
  id: number;
  name: string;
}


/**
 * Respuesta paginada del catálogo de productos.
 */
export interface ProductoPage {
  content: Producto[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}


/**
 * Filtros disponibles para consultar productos.
 */
export interface ProductoFiltros {
  code?: string;
  name?: string;
  fabricType?: string;
  active?: boolean;
  page?: number;
  size?: number;
}


@Injectable({
  providedIn: 'root'
})
export class ProductService {

  private readonly http = inject(HttpClient);

  private readonly apiUrl = '/api/v1/products';


  /**
   * Consulta productos utilizando los filtros disponibles.
   */
  obtenerProductos(
    filtros: ProductoFiltros = {}
  ): Observable<ApiResponse<ProductoPage>> {

    let params = new HttpParams()
      .set('page', filtros.page ?? 0)
      .set('size', filtros.size ?? 20);

    if (filtros.code?.trim()) {
      params = params.set('code', filtros.code.trim());
    }

    if (filtros.name?.trim()) {
      params = params.set('name', filtros.name.trim());
    }

    if (filtros.fabricType?.trim()) {
      params = params.set(
        'fabricType',
        filtros.fabricType.trim()
      );
    }

    if (filtros.active !== undefined) {
      params = params.set('active', filtros.active);
    }

    return this.http.get<ApiResponse<ProductoPage>>(
      this.apiUrl,
      { params }
    );
  }


  /**
   * Consulta un producto por su identificador.
   */
  obtenerProducto(
    id: number
  ): Observable<ApiResponse<Producto>> {

    return this.http.get<ApiResponse<Producto>>(
      `${this.apiUrl}/${id}`
    );
  }


  /**
   * Obtiene únicamente los datos necesarios
   * para un selector de productos.
   *
   * Solo retorna:
   * - id
   * - name
   *
   * Los productos inactivos no se incluyen.
   */
  obtenerProductosParaSelector(): Observable<ProductoSelector[]> {

    const params = new HttpParams()
      .set('page', 0)
      .set('size', 100)
      .set('active', true);

    return this.http
      .get<ApiResponse<ProductoPage>>(
        this.apiUrl,
        { params }
      )
      .pipe(
        map(response =>
          response.data.content.map(producto => ({
            id: producto.id,
            name: producto.name
          }))
        )
      );
  }
}
