export interface Supplier {
  id?: number;
  nombre: string;
  nit?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  estado?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}