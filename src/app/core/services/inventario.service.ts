import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface InventoryBalance {
  id: number;
  variantId: number;
  sku: string;

  productId: number;
  productCode: string;
  productName: string;

  warehouseId: number;
  warehouseCode: string;
  warehouseName: string;

  available: number;
  reserved: number;
  minimum: number;

  status: string;
  lowStock: boolean;

  updatedAt: string;
}

export interface InventoryPage {
  content: InventoryBalance[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface InventoryAdjustmentRequest {
  variantId: number;
  warehouseId: number;
  quantity: number;
  reason: string;
  sourceDocument?: string;
}

export interface InventoryAdjustmentResponse {
  movementId: number;
  balanceId: number;
  variantId: number;
  sku: string;
  warehouseId: number;
  warehouseCode: string;
  quantity: number;
  previousAvailable: number;
  newAvailable: number;
  reserved: number;
  sourceDocument?: string;
  reason: string;
  performedBy: string;
  movementAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class InventarioService {

  private readonly apiUrl = '/api/v1/inventory';

  /*
   * Cambiar únicamente esta ruta si el @PostMapping
   * del backend utiliza otra URL.
   */
  private readonly adjustmentUrl =
    `${this.apiUrl}/adjustments`;

  constructor(
    private http: HttpClient
  ) {}

  // =========================================================
  // INVENTARIO - HU-12
  // =========================================================

  obtenerInventario(
    sku = '',
    product = '',
    warehouse = '',
    status = '',
    lowStock = false,
    page = 0,
    size = 20
  ): Observable<ApiResponse<InventoryPage>> {

    let params = new HttpParams()
      .set('page', page)
      .set('size', size);

    if (sku.trim()) {
      params = params.set('sku', sku.trim());
    }

    if (product.trim()) {
      params = params.set('product', product.trim());
    }

    if (warehouse.trim()) {
      params = params.set('warehouse', warehouse.trim());
    }

    if (status.trim()) {
      params = params.set('status', status.trim());
    }

    params = params.set(
      'lowStock',
      lowStock
    );

    return this.http.get<ApiResponse<InventoryPage>>(
      this.apiUrl,
      { params }
    );
  }

  // =========================================================
  // INVENTARIO BAJO - HU-12
  // =========================================================

  obtenerInventarioBajo(
    product = '',
    warehouse = '',
    page = 0,
    size = 20
  ): Observable<ApiResponse<InventoryPage>> {

    let params = new HttpParams()
      .set('page', page)
      .set('size', size);

    if (product.trim()) {
      params = params.set(
        'product',
        product.trim()
      );
    }

    if (warehouse.trim()) {
      params = params.set(
        'warehouse',
        warehouse.trim()
      );
    }

    return this.http.get<ApiResponse<InventoryPage>>(
      `${this.apiUrl}/low-stock`,
      { params }
    );
  }

  // =========================================================
  // INVENTARIO POR SKU
  // =========================================================

  obtenerInventarioPorSku(
    sku: string
  ): Observable<ApiResponse<any>> {

    return this.http.get<ApiResponse<any>>(
      `${this.apiUrl}/sku/${encodeURIComponent(sku)}`
    );
  }

  // =========================================================
  // AJUSTAR MÍNIMO - HU-12
  // =========================================================

  actualizarMinimo(
    variantId: number,
    warehouseId: number,
    minimum: number
  ): Observable<ApiResponse<any>> {

    return this.http.patch<ApiResponse<any>>(
      `${this.apiUrl}/variants/${variantId}/warehouses/${warehouseId}/minimum`,
      { minimum }
    );
  }

  // =========================================================
  // REGISTRAR AJUSTE - HU-11
  // =========================================================

  registrarAjuste(
    request: InventoryAdjustmentRequest
  ): Observable<ApiResponse<InventoryAdjustmentResponse>> {

    return this.http.post<
      ApiResponse<InventoryAdjustmentResponse>
    >(
      this.adjustmentUrl,
      request
    );
  }
}