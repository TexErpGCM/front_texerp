import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventarioService } from '../../core/services/inventario.service';
import { BalanceInventario, FiltrosInventario } from '../../core/models/inventario.model';

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inventario.html',
  styleUrls: ['./inventario.scss']
})
export class InventarioComponent implements OnInit {

  cargando: boolean = false;

  filtros: FiltrosInventario = {
    sku: '',
    bodegaId: '',
    categoria: '',
    estado: ''
  };

  resumen = {
    totalRegistros: 0,
    totalBajoStock: 0,
    totalAgotados: 0
  };

  listaBodegas = [
    { id: 1, nombre: 'Bodega Principal' },
    { id: 2, nombre: 'Bodega Manizales' },
    { id: 3, nombre: 'Bodega Medellín' },
    { id: 4, nombre: 'Bodega Cali' }
  ];

  respuesta: {
    data: BalanceInventario[];
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
    this.consultarBalances();
  }

  consultarBalances(): void {
    this.cargando = true;
    this.inventarioService.obtenerBalances(this.filtros).subscribe({
      next: (res) => {
        this.respuesta.data = res.data;
        this.respuesta.totalRegistros = res.totalRegistros;
        this.respuesta.totalPaginas = Math.ceil(res.totalRegistros / 10) || 1;

        // Cálculo dinámico de las tarjetas KPI del header
        this.resumen.totalRegistros = res.totalRegistros;
        this.resumen.totalBajoStock = res.data.filter(
          item => item.cantidadDisponible <= item.stockMinimo && item.cantidadDisponible > 0
        ).length;
        this.resumen.totalAgotados = res.data.filter(
          item => item.cantidadDisponible === 0
        ).length;

        this.cargando = false;
      },
      error: () => {
        this.cargando = false;
      }
    });
  }

  aplicarFiltros(): void {
    this.respuesta.paginaActual = 1;
    this.consultarBalances();
  }

  limpiarFiltros(): void {
    this.filtros = {
      sku: '',
      bodegaId: '',
      categoria: '',
      estado: ''
    };
    this.aplicarFiltros();
  }

  cambiarPagina(nuevaPagina: number): void {
    if (nuevaPagina >= 1 && nuevaPagina <= this.respuesta.totalPaginas) {
      this.respuesta.paginaActual = nuevaPagina;
      this.consultarBalances();
    }
  }
}