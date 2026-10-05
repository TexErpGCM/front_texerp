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
  estado?: 'Disponible' | 'Bajo Stock' | 'Agotado';
}

export interface FiltrosInventario {
  sku: string;
  producto: string;
  bodegaId: number | string;
  estado: string;
  page: number;
  pageSize: number;
}

export interface RespuestaPaginadaInventario {
  data: BalanceInventario[];
  totalRegistros: number;
  totalPaginas: number;
  paginaActual: number;
}