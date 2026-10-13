export type TipoMovimiento =
  | 'ADJUSTMENT'
  | 'SALE'
  | 'PURCHASE'
  | 'TRANSFER'
  | 'ENTRADA'
  | 'SALIDA'
  | 'TRANSFERENCIA'
  | 'AJUSTE_POSITIVO'
  | 'AJUSTE_NEGATIVO';

export interface MovimientoInventario {
  id: number;
  movement_type: TipoMovimiento;
  warehouse_id: number;
  quantity: number;
  reserved_delta: number;
  tipo?: TipoMovimiento;
  bodegaId?: number;
  bodegaNombre?: string;
  sku: string;
  producto: string;
  cantidad?: number;
  saldoAnterior: number;
  saldoNuevo: number;
  documentoOrigen: string;
  usuario: string;
  fechaHora: string;
  observaciones?: string;
}

export interface BalanceInventario {
  id: number;
  sku: string;
  producto: string;
  categoria: string;
  bodegaId: number;
  bodegaNombre: string;
  cantidadDisponible: number;
  cantidadReservada: number;
  stockMinimo: number;
  fechaUltimoMovimiento: string;
  estado?: string;
}

export interface FiltrosInventario {
  sku?: string;
  bodegaId?: number | string;
  tipo?: string;
  documentoOrigen?: string;
  categoria?: string;
  estado?: string;
}

export interface RespuestaPaginadaInventario<T> {
  data: T[];
  totalRegistros: number;
  totalPaginas: number;
  paginaActual: number;
}