import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import {
  InventarioService,
  InventoryMovement
} from '../../core/services/inventario.service';

@Component({
  selector: 'app-movimientos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './movimientos.component.html',
  styleUrl: './movimientos.component.scss'
})
export class MovimientosComponent implements OnInit {
  private readonly inventarioService = inject(InventarioService);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);

  movimientos: InventoryMovement[] = [];
  movimientoSeleccionado: InventoryMovement | null = null;
  mostrarDetalle = false;
  cargando = false;
  cargandoDetalle = false;
  mensajeError = '';
  filtroForm!: FormGroup;

  paginaActual = 0;
  tamanioPagina = 20;
  totalElementos = 0;
  totalPaginas = 0;

  ngOnInit(): void {
    this.filtroForm = this.fb.group({
      sku: [''],
      warehouse: [''],
      type: [''],
      from: [''],
      to: ['']
    });
    this.cargarMovimientos();
  }

  cargarMovimientos(): void {
    this.cargando = true;
    this.mensajeError = '';

    const filtros = this.filtroForm.value;

    this.inventarioService.obtenerMovimientos(
      filtros.from || undefined,
      filtros.to || undefined,
      filtros.sku || '',
      filtros.warehouse || '',
      filtros.type || '',
      '',
      this.paginaActual,
      this.tamanioPagina
    ).pipe(
      finalize(() => {
        this.cargando = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: response => {
        if (!response.success || !response.data) {
          this.mensajeError = response.message || 'No fue posible cargar los movimientos.';
          this.limpiarResultados();
          return;
        }

        this.movimientos = response.data.content ?? [];
        this.paginaActual = response.data.page ?? 0;
        this.tamanioPagina = response.data.size ?? this.tamanioPagina;
        this.totalElementos = response.data.totalElements ?? 0;
        this.totalPaginas = response.data.totalPages ?? 0;
      },
      error: error => {
        this.mensajeError = this.obtenerMensajeError(error, 'No fue posible cargar los movimientos.');
        this.limpiarResultados();
      }
    });
  }

  aplicarFiltros(): void {
    this.paginaActual = 0;
    this.cargarMovimientos();
  }

  limpiarFiltros(): void {
    this.filtroForm.reset({ sku: '', warehouse: '', type: '', from: '', to: '' });
    this.paginaActual = 0;
    this.cargarMovimientos();
  }

  cambiarPagina(pagina: number): void {
    if (pagina < 0 || pagina >= this.totalPaginas || pagina === this.paginaActual) {
      return;
    }

    this.paginaActual = pagina;
    this.cargarMovimientos();
  }

  verDetalle(movimiento: InventoryMovement): void {
    this.movimientoSeleccionado = movimiento;
    this.mostrarDetalle = true;
    this.cargandoDetalle = true;

    this.inventarioService.obtenerMovimientoPorId(movimiento.id).pipe(
      finalize(() => {
        this.cargandoDetalle = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: response => {
        if (response.success && response.data) {
          this.movimientoSeleccionado = response.data;
        }
      },
      error: () => {
        // El resumen de la tabla sigue disponible si falla el detalle remoto.
      }
    });
  }

  cerrarDetalle(): void {
    this.mostrarDetalle = false;
    this.movimientoSeleccionado = null;
  }

  tipoTexto(tipo: string): string {
    const tipos: Record<string, string> = {
      ADJUSTMENT: 'Ajuste',
      AJUSTE: 'Ajuste',
      ENTRY: 'Entrada',
      ENTRADA: 'Entrada',
      EXIT: 'Salida',
      SALIDA: 'Salida',
      RESERVATION: 'Reserva',
      RESERVA: 'Reserva',
      RELEASE: 'Liberación',
      LIBERACION: 'Liberación'
    };

    return tipos[tipo] ?? tipo;
  }

  private limpiarResultados(): void {
    this.movimientos = [];
    this.totalElementos = 0;
    this.totalPaginas = 0;
  }

  private obtenerMensajeError(error: any, mensajeDefecto: string): string {
    return error?.error?.message || error?.error?.errors?.[0] || mensajeDefecto;
  }
}
