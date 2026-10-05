import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MovimientoInventarioService } from '../../core/services/movimiento-inventario.service';
import { MovimientoInventario, FiltrosMovimientos, RespuestaPaginadaMovimientos } from '../../core/models/movimiento-inventario.model';

@Component({
  selector: 'app-movimientos-inventario',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './movimientos-inventario.html',
  styleUrl: './movimientos-inventario.scss'
})
export class MovimientosInventarioComponent implements OnInit {

  filtros: FiltrosMovimientos = {
    sku: '',
    bodegaId: '',
    tipo: '',
    documentoOrigen: '',
    fechaInicio: '',
    fechaFin: '',
    page: 1,
    pageSize: 5
  };

  respuesta: RespuestaPaginadaMovimientos = {
    data: [],
    totalRegistros: 0,
    totalPaginas: 1,
    paginaActual: 1
  };

  cargando = false;
  movimientoSeleccionado: MovimientoInventario | null = null; // CA-1: Para modal de detalle

  listaBodegas = [
    { id: 1, nombre: 'Bodega Principal' },
    { id: 2, nombre: 'Bodega Manizales' },
    { id: 3, nombre: 'Bodega Medellín' },
    { id: 4, nombre: 'Bodega Cali' }
  ];

  constructor(private movimientoService: MovimientoInventarioService) {}

  ngOnInit(): void {
    this.consultarMovimientos();
  }

  consultarMovimientos(): void {
    this.cargando = true;
    this.movimientoService.obtenerMovimientos(this.filtros).subscribe({
      next: (res) => {
        this.respuesta = res;
        this.cargando = false;
      },
      error: () => {
        this.cargando = false;
      }
    });
  }

  aplicarFiltros(): void {
    this.filtros.page = 1;
    this.consultarMovimientos();
  }

  limpiarFiltros(): void {
    this.filtros = {
      sku: '',
      bodegaId: '',
      tipo: '',
      documentoOrigen: '',
      fechaInicio: '',
      fechaFin: '',
      page: 1,
      pageSize: 5
    };
    this.consultarMovimientos();
  }

  cambiarPagina(nuevaPagina: number): void {
    if (nuevaPagina >= 1 && nuevaPagina <= this.respuesta.totalPaginas) {
      this.filtros.page = nuevaPagina;
      this.consultarMovimientos();
    }
  }

  verDetalle(movimiento: MovimientoInventario): void {
    this.movimientoSeleccionado = movimiento;
  }

  cerrarDetalle(): void {
    this.movimientoSeleccionado = null;
  }
}