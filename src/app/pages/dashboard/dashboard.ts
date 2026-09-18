import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Estructura de modelo alineada a TexERP
export interface RegistroInventarioTexERP {
  id: number;
  bodega: string;
  variante: string;
  categoria: string;
  proveedor: string;
  stock: number;
  unidadesReservadas: number;
  fechaUltimoMovimiento: string;
  estado: 'Disponible' | 'Bajo Stock' | 'Agotado';
}

export interface KpiCard {
  label: string;
  valor: string | number;
  cambio: string;
  esPositivo: boolean;
  icono: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class DashboardComponent implements OnInit {

  // Criterios de filtrado ([(ngModel)])
  filtroBodega: string = '';
  filtroCategoria: string = '';
  filtroProveedor: string = '';
  fechaInicio: string = '';
  fechaFin: string = '';

  // Listas maestras para combos desplegables
  listaBodegas: string[] = ['Bodega Principal', 'Bodega Manizales', 'Bodega Medellín', 'Bodega Cali'];
  listaCategorias: string[] = ['Telas / Algodón', 'Sintéticos / Poliéster', 'Insumos / Hilos', 'Acabados / Tintes'];
  listaProveedores: string[] = ['Textiles del Pacífico S.A.', 'Hilados Vanessa Ltda.', 'Insumos Industriales SAS'];

  // Data maestra simulada del ERP
  registrosMaestros: RegistroInventarioTexERP[] = [
    { id: 101, bodega: 'Bodega Principal', variante: 'Algodón Peinado 30/1 Blanco', categoria: 'Telas / Algodón', proveedor: 'Textiles del Pacífico S.A.', stock: 1250, unidadesReservadas: 300, fechaUltimoMovimiento: '2026-09-10', estado: 'Disponible' },
    { id: 102, bodega: 'Bodega Manizales', variante: 'Poliéster Estampado Floral', categoria: 'Sintéticos / Poliéster', proveedor: 'Hilados Vanessa Ltda.', stock: 180, unidadesReservadas: 150, fechaUltimoMovimiento: '2026-09-12', estado: 'Bajo Stock' },
    { id: 103, bodega: 'Bodega Medellín', variante: 'Hilo Poliéster Cono 5000m', categoria: 'Insumos / Hilos', proveedor: 'Insumos Industriales SAS', stock: 3400, unidadesReservadas: 800, fechaUltimoMovimiento: '2026-09-15', estado: 'Disponible' },
    { id: 104, bodega: 'Bodega Cali', variante: 'Tinte Reactivo Azul Marino', categoria: 'Acabados / Tintes', proveedor: 'Insumos Industriales SAS', stock: 0, unidadesReservadas: 0, fechaUltimoMovimiento: '2026-08-30', estado: 'Agotado' },
    { id: 105, bodega: 'Bodega Principal', variante: 'Dril Algodón Licrado', categoria: 'Telas / Algodón', proveedor: 'Textiles del Pacífico S.A.', stock: 890, unidadesReservadas: 120, fechaUltimoMovimiento: '2026-09-16', estado: 'Disponible' }
  ];

  ngOnInit(): void {
    // Inicialización si se requiere consumir un servicio RxJS
  }

  // Getter reactivo para aplicar los filtros sobre los registros del ERP
  get registrosFiltrados(): RegistroInventarioTexERP[] {
    return this.registrosMaestros.filter(item => {
      const cumpleBodega = !this.filtroBodega || item.bodega === this.filtroBodega;
      const cumpleCategoria = !this.filtroCategoria || item.categoria === this.filtroCategoria;
      const cumpleProveedor = !this.filtroProveedor || item.proveedor === this.filtroProveedor;
      
      let cumpleFecha = true;
      if (this.fechaInicio) {
        cumpleFecha = cumpleFecha && new Date(item.fechaUltimoMovimiento) >= new Date(this.fechaInicio);
      }
      if (this.fechaFin) {
        cumpleFecha = cumpleFecha && new Date(item.fechaUltimoMovimiento) <= new Date(this.fechaFin);
      }

      return cumpleBodega && cumpleCategoria && cumpleProveedor && cumpleFecha;
    });
  }

  // Métodos de cálculo dinámico para tarjetas KPI
  get totalStockFiltrado(): number {
    return this.registrosFiltrados.reduce((acc, curr) => acc + curr.stock, 0);
  }

  get totalReservado(): number {
    return this.registrosFiltrados.reduce((acc, curr) => acc + curr.unidadesReservadas, 0);
  }

  limpiarFiltros(): void {
    this.filtroBodega = '';
    this.filtroCategoria = '';
    this.filtroProveedor = '';
    this.fechaInicio = '';
    this.fechaFin = '';
  }
}