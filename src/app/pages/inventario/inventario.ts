import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventarioService } from '../../core/services/inventario.service';
import { BalanceInventario, FiltrosInventario, RespuestaPaginadaInventario } from '../../core/models/inventario.model';

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inventario.html',
  styleUrl: './inventario.scss'
})
export class InventarioComponent implements OnInit {

  filtros: FiltrosInventario = {
    sku: '',
    producto: '',
    bodegaId: '',
    estado: '',
    page: 1,
    pageSize: 5
  };

  respuesta: RespuestaPaginadaInventario = {
    data: [],
    totalRegistros: 0,
    totalPaginas: 1,
    paginaActual: 1
  };

  cargando = false;

  // Indicadores (KPIs)
  totalRegistros = 0;
  totalBajoStock = 0;
  totalAgotados = 0;
  totalUnidades = 0;

  listaBodegas = [
    { id: 1, nombre: 'Bodega Principal' },
    { id: 2, nombre: 'Bodega Manizales' },
    { id: 3, nombre: 'Bodega Medellín' },
    { id: 4, nombre: 'Bodega Cali' }
  ];

  constructor(private inventarioService: InventarioService) {}

  ngOnInit(): void {
    this.consultarInventario();
  }

  consultarInventario(): void {
    this.cargando = true;
    this.inventarioService.obtenerBalances(this.filtros).subscribe({
      next: (res) => {
        this.respuesta = res;
        this.calcularKPIs(res.data);
        this.cargando = false;
      },
      error: () => {
        this.cargando = false;
      }
    });
  }

  calcularKPIs(items: BalanceInventario[]): void {
    this.totalRegistros = this.respuesta.totalRegistros;
    this.totalBajoStock = items.filter(i => i.estado === 'Bajo Stock').length;
    this.totalAgotados = items.filter(i => i.estado === 'Agotado').length;
    this.totalUnidades = items.reduce((acc, curr) => acc + curr.cantidadDisponible, 0);
  }

  aplicarFiltros(): void {
    this.filtros.page = 1;
    this.consultarInventario();
  }

  limpiarFiltros(): void {
    this.filtros = {
      sku: '',
      producto: '',
      bodegaId: '',
      estado: '',
      page: 1,
      pageSize: 5
    };
    this.consultarInventario();
  }

  cambiarPagina(nuevaPagina: number): void {
    if (nuevaPagina >= 1 && nuevaPagina <= this.respuesta.totalPaginas) {
      this.filtros.page = nuevaPagina;
      this.consultarInventario();
    }
  }
}