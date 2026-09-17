import { Proveedor } from "./proveedor.model";

export interface ProveedorPage {
  content: Proveedor[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}
