
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  ApiResponse,
  Cotizacion,
  CrearCotizacionRequest,
  CrearVentaRequest,
  PageResponse,
  RegistrarPagoRequest,
  Venta,
  DespacharVentaRequest,
  CancelarVentaRequest,
  CrearOrdenCompraRequest,
  OrdenCompra,
  RechazarOrdenCompraRequest,
  FiltrosOrdenCompra,
  RecepcionCompra,
  RegistrarRecepcionCompraRequest,
  RegistroAuditoria,
  FiltrosAuditoria
} from '../models/comercial.model';

@Injectable({
  providedIn: 'root'
})
export class ComercialService {

  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/v1';

  // ==============================
  // COTIZACIONES
  // ==============================

  listarCotizaciones(
    page = 0,
    size = 20
  ): Observable<ApiResponse<PageResponse<Cotizacion>>> {

    const params = new HttpParams()
      .set('page', page)
      .set('size', size);

    return this.http.get<ApiResponse<PageResponse<Cotizacion>>>(
      `${this.apiUrl}/quotes`,
      { params }
    );
  }

  obtenerCotizacion(
    id: number
  ): Observable<ApiResponse<Cotizacion>> {

    return this.http.get<ApiResponse<Cotizacion>>(
      `${this.apiUrl}/quotes/${id}`
    );
  }

  crearCotizacion(
    request: CrearCotizacionRequest
  ): Observable<ApiResponse<Cotizacion>> {

    return this.http.post<ApiResponse<Cotizacion>>(
      `${this.apiUrl}/quotes`,
      request
    );
  }

  convertirCotizacion(
    id: number,
    warehouseId: number
  ): Observable<ApiResponse<Venta>> {

    return this.http.post<ApiResponse<Venta>>(
      `${this.apiUrl}/quotes/${id}/convert`,
      { warehouseId }
    );
  }

  cancelarCotizacion(
    id: number
  ): Observable<ApiResponse<Cotizacion>> {

    return this.http.patch<ApiResponse<Cotizacion>>(
      `${this.apiUrl}/quotes/${id}/cancel`,
      {}
    );
  }

  // ==============================
  // VENTAS
  // ==============================

  listarVentas(
    page = 0,
    size = 20
  ): Observable<ApiResponse<PageResponse<Venta>>> {

    const params = new HttpParams()
      .set('page', page)
      .set('size', size);

    return this.http.get<ApiResponse<PageResponse<Venta>>>(
      `${this.apiUrl}/sales`,
      { params }
    );
  }

  obtenerVenta(
    id: number
  ): Observable<ApiResponse<Venta>> {

    return this.http.get<ApiResponse<Venta>>(
      `${this.apiUrl}/sales/${id}`
    );
  }

  crearYConfirmarVenta(
    request: CrearVentaRequest
  ): Observable<ApiResponse<Venta>> {

    return this.http.post<ApiResponse<Venta>>(
      `${this.apiUrl}/sales`,
      request
    );
  }

  // ==============================
  // PAGOS DE VENTAS
  // ==============================

  registrarPago(
    saleId: number,
    request: RegistrarPagoRequest
  ): Observable<ApiResponse<Venta>> {

    return this.http.post<ApiResponse<Venta>>(
      `${this.apiUrl}/sales/${saleId}/payments`,
      request
    );
  }

  // ==============================
  // TRANSICIONES DE VENTAS
  // ==============================

  despacharVenta(
    id: number,
    request: DespacharVentaRequest
  ): Observable<ApiResponse<Venta>> {

    return this.http.post<ApiResponse<Venta>>(
      `${this.apiUrl}/sales/${id}/dispatch`,
      request
    );
  }

  completarEntrega(
    id: number
  ): Observable<ApiResponse<Venta>> {

    return this.http.post<ApiResponse<Venta>>(
      `${this.apiUrl}/sales/${id}/deliver`,
      {}
    );
  }

  cancelarVenta(
    id: number,
    request: CancelarVentaRequest
  ): Observable<ApiResponse<Venta>> {

    return this.http.post<ApiResponse<Venta>>(
      `${this.apiUrl}/sales/${id}/cancel`,
      request
    );
  }

  // ==============================
  // ÓRDENES DE COMPRA
  // ==============================

  listarOrdenesCompra(
    page = 0,
    size = 20,
    filtros: FiltrosOrdenCompra = {}
  ): Observable<ApiResponse<PageResponse<OrdenCompra>>> {

    let params = new HttpParams()
      .set('page', page)
      .set('size', size);

    if (filtros.supplierId != null) {
      params = params.set('supplierId', filtros.supplierId);
    }

    if (filtros.status) {
      params = params.set('status', filtros.status);
    }

    if (filtros.fromDate) {
      params = params.set('fromDate', filtros.fromDate);
    }

    if (filtros.toDate) {
      params = params.set('toDate', filtros.toDate);
    }

    if (filtros.variantId != null) {
      params = params.set('variantId', filtros.variantId);
    }

    return this.http.get<ApiResponse<PageResponse<OrdenCompra>>>(
      `${this.apiUrl}/purchase-orders`,
      { params }
    );
  }

  obtenerOrdenCompra(
    id: number
  ): Observable<ApiResponse<OrdenCompra>> {

    return this.http.get<ApiResponse<OrdenCompra>>(
      `${this.apiUrl}/purchase-orders/${id}`
    );
  }

  crearOrdenCompra(
    request: CrearOrdenCompraRequest
  ): Observable<ApiResponse<OrdenCompra>> {

    return this.http.post<ApiResponse<OrdenCompra>>(
      `${this.apiUrl}/purchase-orders`,
      request
    );
  }

  aprobarOrdenCompra(
    id: number
  ): Observable<ApiResponse<OrdenCompra>> {

    return this.http.post<ApiResponse<OrdenCompra>>(
      `${this.apiUrl}/purchase-orders/${id}/approve`,
      {}
    );
  }

  rechazarOrdenCompra(
    id: number,
    request: RechazarOrdenCompraRequest
  ): Observable<ApiResponse<OrdenCompra>> {

    return this.http.post<ApiResponse<OrdenCompra>>(
      `${this.apiUrl}/purchase-orders/${id}/reject`,
      request
    );
  }

  // ==============================
  // RECEPCIONES DE COMPRA
  // ==============================

  registrarRecepcionCompra(
    id: number,
    request: RegistrarRecepcionCompraRequest
  ): Observable<ApiResponse<RecepcionCompra>> {

    return this.http.post<ApiResponse<RecepcionCompra>>(
      `${this.apiUrl}/purchase-orders/${id}/receipts`,
      request
    );
  }

  listarRecepcionesCompra(
    id: number
  ): Observable<ApiResponse<RecepcionCompra[]>> {

    return this.http.get<ApiResponse<RecepcionCompra[]>>(
      `${this.apiUrl}/purchase-orders/${id}/receipts`
    );
  }

  obtenerRecepcionCompra(
    id: number
  ): Observable<ApiResponse<RecepcionCompra>> {

    return this.http.get<ApiResponse<RecepcionCompra>>(
      `${this.apiUrl}/purchase-receipts/${id}`
    );
  }

  // ==============================
  // AUDITORÍA
  // ==============================

  listarAuditoria(
    page = 0,
    size = 20,
    filtros: FiltrosAuditoria = {}
  ): Observable<ApiResponse<PageResponse<RegistroAuditoria>>> {

    let params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('sort', 'createdAt,desc');

    if (filtros.entity) {
      params = params.set('entity', filtros.entity);
    }

    if (filtros.action) {
      params = params.set('action', filtros.action);
    }

    if (filtros.user) {
      params = params.set('user', filtros.user);
    }

    if (filtros.fromDate) {
      params = params.set('fromDate', filtros.fromDate);
    }

    if (filtros.toDate) {
      params = params.set('toDate', filtros.toDate);
    }

    return this.http.get<ApiResponse<PageResponse<RegistroAuditoria>>>(
      `${this.apiUrl}/audit-logs`,
      { params }
    );
  }
}
