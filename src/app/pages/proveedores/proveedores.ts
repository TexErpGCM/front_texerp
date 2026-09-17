import {
  Component,
  OnInit,
  inject
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

import {
  FormsModule
} from '@angular/forms';

import {
  finalize
} from 'rxjs';

import { SupplierService } from '../../core/services/supplier.service';

import { Proveedor } from '../../core/models/proveedor/proveedor.model';

import { CrearProveedorRequest } from '../../core/models/proveedor/crear.proveedor.request.model';

@Component({
  selector: 'app-proveedores',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './proveedores.html',
  styleUrl: './proveedores.scss'
})
export class ProveedoresComponent implements OnInit {

  private supplierService = inject(SupplierService);


  proveedores: Proveedor[] = [];

  proveedorSeleccionado: Proveedor | null = null;



  paginaActual = 0;

  tamanioPagina = 20;

  totalElementos = 0;

  totalPaginas = 0;

  // ==========================================
  // FILTROS
  // ==========================================

  filtroTaxId = '';

  filtroNombre = '';

  filtroActivo: boolean | undefined = undefined;

  // ==========================================
  // FORMULARIO
  // ==========================================

  mostrarFormulario = false;

  modoEdicion = false;

  guardando = false;

  errorFormulario = '';

  mensajeExito = '';

  // ==========================================
  // MODELO
  // ==========================================

  formulario: CrearProveedorRequest = {
    taxId: '',
    name: '',
    active: true
  };

  // ==========================================
  // INIT
  // ==========================================

  ngOnInit(): void {

    this.cargarProveedores();

  }

  // ==========================================
  // CARGAR PROVEEDORES
  // ==========================================

  cargarProveedores(): void {

    this.supplierService
      .obtenerProveedores({
        taxId: this.filtroTaxId,
        name: this.filtroNombre,
        active: this.filtroActivo,
        page: this.paginaActual,
        size: this.tamanioPagina
      })
      .subscribe({

        next: (response) => {

          this.proveedores =
            response.data.content;

          this.totalElementos =
            response.data.totalElements;

          this.totalPaginas =
            response.data.totalPages;

        },

        error: (error) => {

          console.error(
            'Error cargando proveedores',
            error
          );

          this.manejarError(error);

        }

      });
  }

  // ==========================================
  // BUSCAR
  // ==========================================

  buscar(): void {

    this.paginaActual = 0;

    this.cargarProveedores();

  }

  // ==========================================
  // LIMPIAR FILTROS
  // ==========================================

  limpiarFiltros(): void {

    this.filtroTaxId = '';

    this.filtroNombre = '';

    this.filtroActivo = undefined;

    this.paginaActual = 0;

    this.cargarProveedores();

  }

  // ==========================================
  // PAGINACIÓN
  // ==========================================

  cambiarPagina(pagina: number): void {

    if (
      pagina < 0 ||
      pagina >= this.totalPaginas
    ) {
      return;
    }

    this.paginaActual = pagina;

    this.cargarProveedores();

  }

  // ==========================================
  // NUEVO PROVEEDOR
  // ==========================================

  nuevoProveedor(): void {

    this.modoEdicion = false;

    this.proveedorSeleccionado = null;

    this.errorFormulario = '';

    this.mensajeExito = '';

    this.formulario = {
      taxId: '',
      name: '',
      active: true
    };

    this.mostrarFormulario = true;

  }

  // ==========================================
  // EDITAR
  // ==========================================

  editar(proveedor: Proveedor): void {

    this.modoEdicion = true;

    this.proveedorSeleccionado = proveedor;

    this.errorFormulario = '';

    this.mensajeExito = '';

    this.formulario = {
      taxId: proveedor.taxId,
      name: proveedor.name,
      active: proveedor.active
    };

    this.mostrarFormulario = true;

  }

  // ==========================================
  // GUARDAR
  // ==========================================

  guardar(): void {

    this.errorFormulario = '';

    this.mensajeExito = '';

    if (!this.validarFormulario()) {
      return;
    }

    this.guardando = true;

    // ========================================
    // ACTUALIZAR
    // ========================================

    if (
      this.modoEdicion &&
      this.proveedorSeleccionado
    ) {

      this.supplierService
        .actualizarProveedor(
          this.proveedorSeleccionado.id,
          this.formulario
        )
        .pipe(
          finalize(() => {
            this.guardando = false;
          })
        )
        .subscribe({

          next: (response) => {

            this.mensajeExito =
              response.message ||
              'Proveedor actualizado correctamente';

            this.mostrarFormulario = false;

            this.cargarProveedores();

          },

          error: (error) => {

            this.manejarError(error);

          }

        });

      return;
    }

    // ========================================
    // CREAR
    // ========================================

    this.supplierService
      .crearProveedor(
        this.formulario
      )
      .pipe(
        finalize(() => {
          this.guardando = false;
        })
      )
      .subscribe({

        next: (response) => {

          this.mensajeExito =
            response.message ||
            'Proveedor creado correctamente';

          this.mostrarFormulario = false;

          this.cargarProveedores();

        },

        error: (error) => {

          this.manejarError(error);

        }

      });

  }

  // ==========================================
  // VALIDACIÓN
  // ==========================================

  validarFormulario(): boolean {

    if (!this.formulario.taxId.trim()) {

      this.errorFormulario =
        'La identificación tributaria es obligatoria.';

      return false;

    }

    if (!this.formulario.name.trim()) {

      this.errorFormulario =
        'El nombre del proveedor es obligatorio.';

      return false;

    }

    return true;

  }

  // ==========================================
  // CAMBIAR ESTADO
  // ==========================================

  cambiarEstado(proveedor: Proveedor): void {

    const nuevoEstado =
      !proveedor.active;

    this.supplierService
      .actualizarEstado(
        proveedor.id,
        nuevoEstado
      )
      .subscribe({

        next: (response) => {

          proveedor.active =
            response.data.active;

          this.mensajeExito =
            response.message ||
            'Estado del proveedor actualizado correctamente';

        },

        error: (error) => {

          this.manejarError(error);

        }

      });

  }

  // ==========================================
  // CERRAR FORMULARIO
  // ==========================================

  cancelar(): void {

    this.mostrarFormulario = false;

    this.errorFormulario = '';

  }

  // ==========================================
  // ERRORES
  // ==========================================

  private manejarError(error: any): void {

    console.error(
      'Error en proveedores:',
      error
    );

    if (error.status === 400) {

      this.errorFormulario =
        error.error?.message ||
        'Los datos enviados no son válidos.';

      return;

    }

    if (error.status === 403) {

      this.errorFormulario =
        'No tiene permisos para realizar esta operación.';

      return;

    }

    if (error.status === 404) {

      this.errorFormulario =
        error.error?.message ||
        'El proveedor no fue encontrado.';

      return;

    }

    if (error.status === 409) {

      this.errorFormulario =
        error.error?.message ||
        'El proveedor ya se encuentra registrado.';

      return;

    }

    this.errorFormulario =
      error.error?.message ||
      'Ocurrió un error al procesar la solicitud.';

  }

}
