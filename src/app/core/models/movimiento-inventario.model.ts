export interface MovimientoInventario {}
export type TipoMovimiento = 'ENTRADA' | 'SALIDA' | 'AJUSTE_POSITIVO' | 'AJUSTE_NEGATIVO' | 'TRANSFERENCIA';

export interface MovimientoInventario {
  id: number;
  fechaHora: string;
  sku: string;
  producto: string;
  bodegaId: number;
  bodegaNombre: string;
  tipo: TipoMovimiento;
  cantidad: number;
  saldoAnterior: number;
  saldoNuevo: number;
  documentoOrigen: string; // Ej: FAC-2026-001, REC-2026-042, AJU-2026-005
  usuario: string;
  observaciones?: string;
  esInmutable: boolean; // CA-4: Indicador de registro bloqueado
}

export interface FiltrosMovimientos {
  sku?: string;
  bodegaId?: number | string;
  tipo?: string;
  documentoOrigen?: string;
  fechaInicio?: string;
  fechaFin?: string;
  page: number;
  pageSize: number;
}

export interface RespuestaPaginadaMovimientos {
  data: MovimientoInventario[];
  totalRegistros: number;
  totalPaginas: number;
  paginaActual: number;
}