
export type EstadoCotizacion =
  | 'DRAFT'
  | 'SENT'
  | 'CONVERTED'
  | 'CANCELLED'
  | 'EXPIRED';

export type EstadoVenta =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PARTIALLY_PAID'
  | 'PAID'
  | 'DISPATCHED'
  | 'COMPLETED'
  | 'CANCELLED';

// ==============================
// COTIZACIONES
// ==============================

export interface LineaCotizacionRequest {
  variantId: number;
  quantity: number;
  unitPrice: number;
}

export interface CrearCotizacionRequest {
  customerId: number;
  issueDate: string;
  expirationDate: string;
  notes?: string | null;
  lines: LineaCotizacionRequest[];
}

export interface LineaCotizacion {
  id?: number;
  variantId: number;
  sku?: string;
  productName?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Cotizacion {
  id: number;
  number: string;
  customerId: number;
  customerName?: string;
  issueDate: string;
  expirationDate: string;
  status: EstadoCotizacion | string;
  subtotal: number;
  total: number;
  convertedSaleId?: number | null;
  convertedSaleNumber?: string | null;
  notes?: string | null;
  lines: LineaCotizacion[];
  createdAt?: string;
}

// ==============================
// VENTAS
// ==============================

export interface LineaVentaRequest {
  variantId: number;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  taxRate: number;
}

export interface CrearVentaRequest {
  customerId: number;
  warehouseId: number;
  quoteId?: number | null;
  notes?: string | null;
  lines: LineaVentaRequest[];
}

export interface LineaVenta {
  id?: number;
  variantId: number;
  sku?: string;
  product?: string;
  quantity: number;
  unitPrice: number;
  unitCost?: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  subtotal: number;
  total: number;
}

// ==============================
// PAGOS DE VENTAS
// ==============================

export interface PagoVenta {
  id: number;
  method: string;
  amount: number;
  paidAt: string;
  reference: string | null;
}

export interface RegistrarPagoRequest {
  method: string;
  amount: number;
  paidAt: string;
  reference?: string | null;
}

// ==============================
// RESPUESTA DE VENTAS
// ==============================

export interface Venta {
  id: number;
  number: string;
  status: EstadoVenta | string;
  confirmedAt: string;

  customerId: number;
  customerDocument?: string;
  customerName?: string;

  warehouseId: number;
  warehouseCode?: string;
  warehouseName?: string;

  quotationId?: number | null;
  quotationNumber?: string | null;

  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  total: number;

  totalPaid: number;
  pendingBalance: number;

  lines: LineaVenta[];
  payments: PagoVenta[];
}

// ==============================
// RESPUESTAS API
// ==============================

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp?: string;
}

// ==============================
// TRANSICIONES DE VENTAS
// ==============================

export interface DespacharVentaRequest {
  evidence?: string | null;
}

export interface CancelarVentaRequest {
  reason: string;
}

// ==============================
// ÓRDENES DE COMPRA
// ==============================

export type EstadoOrdenCompra =
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'PARTIALLY_RECEIVED'
  | 'RECEIVED'
  | 'COMPLETED';

export interface LineaOrdenCompraRequest {
  variantId: number;
  quantity: number;
  unitCost: number;
}

export interface CrearOrdenCompraRequest {
  supplierId: number;
  orderDate: string;
  lines: LineaOrdenCompraRequest[];
}

export interface LineaOrdenCompra extends LineaOrdenCompraRequest {
  id?: number;
  sku?: string;
  receivedQuantity?: number;
  subtotal?: number;
}

export interface OrdenCompra {
  id: number;
  number: string;
  supplierId: number;
  supplierName?: string;
  orderDate: string;
  status: EstadoOrdenCompra | string;
  total: number;
  lines: LineaOrdenCompra[];
  receipts?: RecepcionCompra[];
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;
}

export interface RechazarOrdenCompraRequest {
  reason: string;
}

// ==============================
// RECEPCIONES DE COMPRA
// ==============================

export interface LineaRecepcionCompra {
  orderLineId: number;
  variantId?: number;
  sku?: string;
  quantity: number;
  unitCost?: number;
}

export interface RecepcionCompra {
  id: number;
  number: string;
  purchaseOrderId: number;
  warehouseId: number;
  warehouseName?: string;
  document?: string;
  receivedAt: string;
  lines: LineaRecepcionCompra[];
}

export interface RegistrarRecepcionCompraRequest {
  warehouseId: number;
  document: string;
  lines: {
    orderLineId: number;
    quantity: number;
  }[];
}

// ==============================
// FILTROS DE ÓRDENES DE COMPRA
// ==============================

export interface FiltrosOrdenCompra {
  supplierId?: number | null;
  status?: string;
  fromDate?: string;
  toDate?: string;
  variantId?: number | null;
}

// ==============================
// AUDITORÍA
// ==============================

export interface RegistroAuditoria {
  id: number;
  entity: string;
  entityId: string | number;
  action: string;
  oldValue?: unknown;
  newValue?: unknown;
  user?: string;
  username?: string;
  createdAt: string;
}

export interface FiltrosAuditoria {
  entity?: string;
  action?: string;
  user?: string;
  fromDate?: string;
  toDate?: string;
}
