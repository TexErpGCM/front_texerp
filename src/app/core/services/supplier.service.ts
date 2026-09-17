import { Injectable, inject } from '@angular/core';
import {
  HttpClient,
  HttpParams
} from '@angular/common/http';
import { Observable } from 'rxjs';

import { ApiResponse } from './user.services';
import { ProveedorFiltros } from '../models/proveedor/proveedor.filtros.model';
import { ProveedorPage } from '../models/proveedor/Proveedor.page.model';
import { Proveedor } from '../models/proveedor/proveedor.model';
import { ActualizarEstadoProveedorRequest } from '../models/proveedor/actualizar.estado.proveedor.request.model';
import { CrearProveedorRequest } from '../models/proveedor/crear.proveedor.request.model';



@Injectable({
  providedIn: 'root'
})
export class SupplierService {

  private readonly http = inject(HttpClient);

  private readonly apiUrl = '/api/v1/suppliers';

  // ==========================================
  // LISTAR / BUSCAR
  // ==========================================

  obtenerProveedores(
    filtros: ProveedorFiltros = {}
  ): Observable<ApiResponse<ProveedorPage>> {

    let params = new HttpParams();

    params = params.set(
      'page',
      filtros.page ?? 0
    );

    params = params.set(
      'size',
      filtros.size ?? 20
    );

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

    if (filtros.active !== undefined) {

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

  // ==========================================
  // OBTENER POR ID
  // ==========================================

  obtenerProveedor(
    id: number
  ): Observable<ApiResponse<Proveedor>> {

    return this.http.get<ApiResponse<Proveedor>>(
      `${this.apiUrl}/${id}`
    );
  }

  // ==========================================
  // CREAR
  // ==========================================

  crearProveedor(
    request: CrearProveedorRequest
  ): Observable<ApiResponse<Proveedor>> {

    return this.http.post<ApiResponse<Proveedor>>(
      this.apiUrl,
      request
    );
  }

  // ==========================================
  // ACTUALIZAR
  // ==========================================

  actualizarProveedor(
    id: number,
    request: CrearProveedorRequest
  ): Observable<ApiResponse<Proveedor>> {

    return this.http.put<ApiResponse<Proveedor>>(
      `${this.apiUrl}/${id}`,
      request
    );
  }

  // ==========================================
  // CAMBIAR ESTADO
  // ==========================================

  actualizarEstado(
    id: number,
    active: boolean
  ): Observable<ApiResponse<Proveedor>> {

    const request: ActualizarEstadoProveedorRequest = {
      active
    };

    return this.http.patch<ApiResponse<Proveedor>>(
      `${this.apiUrl}/${id}/status`,
      request
    );
  }
}
