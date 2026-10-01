import {
  ChangeDetectorRef,
  Component,
  OnInit
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { LoadingComponent } from '../../layout/loading/loading.component';

import {
  InventarioService,
  InventoryBalance,
  InventoryAdjustmentRequest
} from '../../core/services/inventario.service';

import {
  Bodega,
  BodegaService
} from '../../core/services/bodega.service';

@Component({
  selector: 'app-listar-inventario',
  standalone: true,

  imports: [
    CommonModule,
    FormsModule,
    LoadingComponent
  ],

  templateUrl: './inventario.component.html',
  styleUrl: './inventario.component.scss'
})
export class ListarInventarioComponent implements OnInit {



  inventario: InventoryBalance[] = [];

  cargando = false;


  mensajeExito = '';
  mensajeError = '';

  // =========================================================
  // FILTROS - HU-12
  // =========================================================

  sku = '';
  producto = '';
  bodega = '';

  mostrarSoloBajo = false;

  // =========================================================
  // PAGINACIÓN
  // =========================================================

  paginaActual = 0;
  pageSize = 20;

  totalElementos = 0;
  totalPaginas = 0;

  // =========================================================
  // FORMULARIO DE AJUSTE - HU-11
  // =========================================================

  mostrarFormulario = false;

  ajusteVariante: number | null = null;
  ajusteBodega: number | null = null;

  /*
   * Positivo:
   *  5  = aumenta 5 unidades
   *
   * Negativo:
   * -5  = disminuye 5 unidades
   */
  ajusteCantidad: number | null = null;

  ajusteMotivo = '';
  ajusteDocumento = '';

  guardando = false;

  bodegas: Bodega[] = [];
cargandoBodegas = false;

  // =========================================================
  // CONSTRUCTOR
  // =========================================================

  constructor(
    private inventarioService: InventarioService,
      private bodegaService: BodegaService,
    private cdr: ChangeDetectorRef
  ) {}

  // =========================================================
  // INICIALIZACIÓN
  // =========================================================

  ngOnInit(): void {
    this.cargarInventario();
      this.cargarBodegas();
  }

  // =========================================================
// CARGAR BODEGAS
// =========================================================

cargarBodegas(): void {

  this.cargandoBodegas = true;

  this.bodegaService
    .listar(
      {
        active: true
      },
      0,
      100
    )
    .pipe(
      finalize(() => {
        this.cargandoBodegas = false;
        this.cdr.detectChanges();
      })
    )
    .subscribe({

      next: (response) => {

        this.bodegas =
          response.data?.content ?? [];

      },

      error: () => {

        this.bodegas = [];

        this.mensajeError =
          'No fue posible cargar las bodegas.';

      }

    });
}
  // =========================================================
  // CONSULTAR INVENTARIO
  // HU-12
  // =========================================================

  cargarInventario(): void {

    this.cargando = true;

    this.mensajeError = '';

    if (this.mostrarSoloBajo) {

      this.cargarInventarioBajo();

      return;
    }

    this.inventarioService
      .obtenerInventario(
        this.sku,
        this.producto,
        this.bodega,
        '',
        false,
        this.paginaActual,
        this.pageSize
      )
      .pipe(
        finalize(() => {

          this.cargando = false;

          this.cdr.detectChanges();

        })
      )
      .subscribe({

        next: (response) => {

          this.procesarRespuesta(
            response.data
          );

        },

        error: () => {

          this.inventario = [];

          this.totalElementos = 0;
          this.totalPaginas = 0;

          this.mensajeError =
            'No fue posible consultar el inventario.';

        }

      });
  }

  // =========================================================
  // INVENTARIO BAJO
  // HU-12
  // =========================================================

  private cargarInventarioBajo(): void {

    this.inventarioService
      .obtenerInventarioBajo(
        this.producto,
        this.bodega,
        this.paginaActual,
        this.pageSize
      )
      .pipe(
        finalize(() => {

          this.cargando = false;

          this.cdr.detectChanges();

        })
      )
      .subscribe({

        next: (response) => {

          this.procesarRespuesta(
            response.data
          );

        },

        error: () => {

          this.inventario = [];

          this.totalElementos = 0;
          this.totalPaginas = 0;

          this.mensajeError =
            'No fue posible consultar el inventario bajo.';

        }

      });
  }

  // =========================================================
  // PROCESAR RESPUESTA
  // =========================================================

  private procesarRespuesta(
    data: any
  ): void {

    this.inventario =
      data?.content ?? [];

    this.totalElementos =
      data?.totalElements ?? 0;

    this.totalPaginas =
      data?.totalPages ?? 0;
  }

  // =========================================================
  // FILTROS
  // =========================================================

  aplicarFiltros(): void {

    this.paginaActual = 0;

    this.mensajeError = '';
    this.mensajeExito = '';

    this.cargarInventario();
  }

  buscar(): void {

    this.aplicarFiltros();
  }

  limpiarFiltros(): void {

    this.sku = '';
    this.producto = '';
    this.bodega = '';

    this.mostrarSoloBajo = false;

    this.paginaActual = 0;

    this.mensajeError = '';
    this.mensajeExito = '';

    this.cargarInventario();
  }

  cambiarFiltroBajo(): void {

    this.paginaActual = 0;

    this.mensajeError = '';
    this.mensajeExito = '';

    this.cargarInventario();
  }

  // =========================================================
  // PAGINACIÓN
  // =========================================================

  cambiarPagina(
    pagina: number
  ): void {

    if (pagina < 0) {
      return;
    }

    if (
      pagina >= this.totalPaginas
    ) {
      return;
    }

    this.paginaActual = pagina;

    this.cargarInventario();
  }

  paginaAnterior(): void {

    this.cambiarPagina(
      this.paginaActual - 1
    );
  }

  paginaSiguiente(): void {

    this.cambiarPagina(
      this.paginaActual + 1
    );
  }

  // =========================================================
  // ESTADO - HU-12
  // =========================================================

  obtenerEstado(
    item: InventoryBalance
  ): string {

    return item.lowStock
      ? 'Bajo'
      : 'Normal';
  }

  esInventarioBajo(
    item: InventoryBalance
  ): boolean {

    return item.lowStock;
  }

  // =========================================================
  // AJUSTES
  // HU-11
  // =========================================================

  nuevoAjuste(): void {

    this.abrirFormularioAjuste();
  }

  abrirFormularioAjuste(): void {

    this.limpiarFormularioAjuste();

    this.mensajeError = '';
    this.mensajeExito = '';

    this.mostrarFormulario = true;
  }

  cerrarFormularioAjuste(): void {

    if (this.guardando) {
      return;
    }

    this.mostrarFormulario = false;
  }

  cancelar(): void {

    this.cerrarFormularioAjuste();
  }

  limpiarFormularioAjuste(): void {

    this.ajusteVariante = null;
    this.ajusteBodega = null;

    this.ajusteCantidad = null;

    this.ajusteMotivo = '';
    this.ajusteDocumento = '';

    this.guardando = false;
  }

  // =========================================================
  // VALIDAR AJUSTE
  // =========================================================

  private validarAjuste(): boolean {

    this.mensajeError = '';

    if (
      this.ajusteVariante === null ||
      this.ajusteVariante <= 0
    ) {

      this.mensajeError =
        'La variante es obligatoria.';

      return false;
    }

    if (
      this.ajusteBodega === null ||
      this.ajusteBodega <= 0
    ) {

      this.mensajeError =
        'La bodega es obligatoria.';

      return false;
    }

    if (
      this.ajusteCantidad === null ||
      this.ajusteCantidad === 0
    ) {

      this.mensajeError =
        'La cantidad del ajuste es obligatoria y no puede ser cero.';

      return false;
    }

    if (
      !this.ajusteMotivo.trim()
    ) {

      this.mensajeError =
        'El motivo del ajuste es obligatorio.';

      return false;
    }

    if (
      this.ajusteMotivo.trim().length > 500
    ) {

      this.mensajeError =
        'El motivo no puede superar los 500 caracteres.';

      return false;
    }

    if (
      this.ajusteDocumento.trim().length > 255
    ) {

      this.mensajeError =
        'El documento origen no puede superar 255 caracteres.';

      return false;
    }

    return true;
  }

  // =========================================================
  // GUARDAR AJUSTE
  // HU-11
  // =========================================================

  guardarAjuste(): void {

    if (!this.validarAjuste()) {
      return;
    }

    const request: InventoryAdjustmentRequest = {

      variantId:
        this.ajusteVariante!,

      warehouseId:
        this.ajusteBodega!,

      quantity:
        this.ajusteCantidad!,

      reason:
        this.ajusteMotivo.trim(),

      sourceDocument:
        this.ajusteDocumento.trim() || undefined
    };

    this.guardando = true;

    this.mensajeError = '';
    this.mensajeExito = '';

    this.inventarioService
      .registrarAjuste(request)
      .pipe(
        finalize(() => {

          this.guardando = false;

          this.cdr.detectChanges();

        })
      )
      .subscribe({

        next: (response) => {

          this.mostrarFormulario = false;

          this.mensajeExito =
            response.message ||
            'El ajuste de inventario fue registrado correctamente.';

          /*
           * Recargamos el inventario para que HU-12
           * refleje inmediatamente el nuevo balance.
           *
           * Esto también permite que una alerta de
           * inventario bajo desaparezca cuando el nuevo
           * disponible supera el mínimo.
           */

          this.cargarInventario();

        },

        error: (error) => {

          /*
           * 400:
           * datos inválidos / motivo faltante
           *
           * 409:
           * el ajuste produciría inventario negativo
           * o alguna regla de negocio impide la operación.
           */

          if (error?.status === 400) {

            this.mensajeError =
              error?.error?.message ||
              'Los datos del ajuste no son válidos.';

          } else if (error?.status === 409) {

            this.mensajeError =
              error?.error?.message ||
              'El ajuste no puede realizarse porque produciría un inventario no permitido.';

          } else {

            this.mensajeError =
              error?.error?.message ||
              'No fue posible registrar el ajuste.';

          }

        }

      });
  }
}