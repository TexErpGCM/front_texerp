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

export interface SkuInventoryResponse {
  variantId: number;
  sku: string;
  productId: number;
  productCode: string;
  productName: string;
  balances: InventoryBalance[];
}

export interface InventoryMovement {
  id: number;
  variantId: number;
  sku: string;
  productId: number;
  productCode: string;
  productName: string;
  warehouseId: number;
  warehouseCode: string;
  warehouseName: string;
  type: string;
  quantity: number;
  reservedDelta: number;
  previousAvailable: number;
  newAvailable: number;
  previousReserved: number;
  newReserved: number;
  sourceDocument?: string;
  performedBy: string;
  movementAt: string;
  reason: string;
  compensatesMovementId?: number;
}

export interface InventoryMovementPage {
  content: InventoryMovement[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface CompensationRequest {
  sourceDocument: string;
  reason: string;
}

@Injectable({
  providedIn: 'root'
})
export class InventarioService {

  private readonly apiUrl = '/api/v1/inventory';

  private readonly adjustmentUrl =
    `${this.apiUrl}/adjustments`;

  constructor(
    private http: HttpClient
  ) { }

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

  obtenerInventarioPorSku(
    sku: string
  ): Observable<ApiResponse<SkuInventoryResponse>> {

    return this.http.get<ApiResponse<SkuInventoryResponse>>(
      `${this.apiUrl}/sku/${encodeURIComponent(sku)}`
    );
  }

  actualizarMinimo(
    variantId: number,
    warehouseId: number,
    minimum: number
  ): Observable<ApiResponse<InventoryBalance>> {

    return this.http.patch<ApiResponse<InventoryBalance>>(
      `${this.apiUrl}/variants/${variantId}/warehouses/${warehouseId}/minimum`,
      { minimum }
    );
  }

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

  obtenerMovimientos(
    from?: string,
    to?: string,
    sku = '',
    warehouse = '',
    type = '',
    document = '',
    page = 0,
    size = 20
  ): Observable<ApiResponse<InventoryMovementPage>> {

    let params = new HttpParams()
      .set('page', page)
      .set('size', size);

    if (from?.trim()) {
      params = params.set(
        'from',
        from.trim()
      );
    }

    if (to?.trim()) {
      params = params.set(
        'to',
        to.trim()
      );
    }

    if (sku.trim()) {
      params = params.set(
        'sku',
        sku.trim()
      );
    }

    if (warehouse.trim()) {
      params = params.set(
        'warehouse',
        warehouse.trim()
      );
    }

    if (type.trim()) {
      params = params.set(
        'type',
        type.trim()
      );
    }

    if (document.trim()) {
      params = params.set(
        'document',
        document.trim()
      );
    }

    return this.http.get<ApiResponse<InventoryMovementPage>>(
      `${this.apiUrl}/movements`,
      { params }
    );
  }

  obtenerMovimientoPorId(
    id: number
  ): Observable<ApiResponse<InventoryMovement>> {

    return this.http.get<ApiResponse<InventoryMovement>>(
      `${this.apiUrl}/movements/${id}`
    );
  }

  compensarMovimiento(
    id: number,
    request: CompensationRequest
  ): Observable<ApiResponse<InventoryMovement>> {

    return this.http.post<ApiResponse<InventoryMovement>>(
      `${this.apiUrl}/movements/${id}/compensations`,
      request
    );
  }
}