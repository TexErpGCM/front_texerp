import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventarioService } from '../../core/services/inventario.service';
import { MovimientoInventario, FiltrosInventario } from '../../core/models/inventario.model';

@Component({
  selector: 'app-movimientos-inventario',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './movimientos-inventario.html',
  styleUrls: ['./movimientos-inventario.scss']
})
export class MovimientosInventarioComponent implements OnInit {

  cargando: boolean = false;
  movimientoSeleccionado: MovimientoInventario | null = null;

  filtros: FiltrosInventario = {
    sku: '',
    bodegaId: '',
    tipo: '',
    documentoOrigen: ''
  };

  listaBodegas = [
    { id: 1, nombre: 'Bodega Principal' },
    { id: 2, nombre: 'Bodega Manizales' },
    { id: 3, nombre: 'Bodega Medellín' },
    { id: 4, nombre: 'Bodega Cali' }
  ];

  respuesta: {
    data: MovimientoInventario[];
    totalRegistros: number;
    totalPaginas: number;
    paginaActual: number;
  } = {
    data: [],
    totalRegistros: 0,
    totalPaginas: 1,
    paginaActual: 1
  };

  constructor(private inventarioService: InventarioService) {}

  ngOnInit(): void {
    this.consultarMovimientos();
  }

  consultarMovimientos(): void {
    this.cargando = true;
    this.inventarioService.obtenerMovimientos(this.filtros).subscribe({
      next: (res) => {
        this.respuesta.data = res.data;
        this.respuesta.totalRegistros = res.totalRegistros;
        this.respuesta.totalPaginas = Math.ceil(res.totalRegistros / 10) || 1;
        this.cargando = false;
      },
      error: () => {
        this.cargando = false;
      }
    });
  }

  aplicarFiltros(): void {
    this.respuesta.paginaActual = 1;
    this.consultarMovimientos();
  }

  limpiarFiltros(): void {
    this.filtros = {
      sku: '',
      bodegaId: '',
      tipo: '',
      documentoOrigen: ''
    };
    this.aplicarFiltros();
  }

  cambiarPagina(nuevaPagina: number): void {
    if (nuevaPagina >= 1 && nuevaPagina <= this.respuesta.totalPaginas) {
      this.respuesta.paginaActual = nuevaPagina;
      this.consultarMovimientos();
    }
  }

  verDetalle(item: MovimientoInventario): void {
    this.movimientoSeleccionado = item;
  }

  cerrarDetalle(): void {
    this.movimientoSeleccionado = null;
  }
}