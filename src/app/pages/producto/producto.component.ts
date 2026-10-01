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
  Product,
  ProductRequest,
  ProductService
} from '../../core/services/producto.service';

@Component({
  selector: 'app-listar-producto',
  standalone: true,

  imports: [
    CommonModule,
    FormsModule,
    LoadingComponent
  ],

  templateUrl: './producto.component.html',
  styleUrl: './producto.component.scss'
})
export class ListarProductoComponent implements OnInit {

  productos: Product[] = [];

  cargando = false;
  guardando = false;

  mensajeExito = '';
  mensajeError = '';

  codigo = '';
  nombre = '';
  tipoTela = '';
  estado: boolean | null = null;

  paginaActual = 0;
  pageSize = 20;

  totalElementos = 0;
  totalPaginas = 0;

  mostrarFormulario = false;
  editando = false;

  productoId: number | null = null;

  formularioCodigo = '';
  formularioNombre = '';
  formularioTipoTela = '';
  formularioComposicion = '';
  formularioActivo = true;

  ngOnInit(): void {
    this.cargarProductos();
  }

  constructor(
    private productoService: ProductService,
    private cdr: ChangeDetectorRef
  ) {}

  cargarProductos(): void {

    this.cargando = true;
    this.mensajeError = '';

    this.productoService
      .listar(
        this.codigo,
        this.nombre,
        this.tipoTela,
        this.estado,
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

          const data = response.data;

          this.productos =
            data?.content ?? [];

          this.totalElementos =
            data?.totalElements ?? 0;

          this.totalPaginas =
            data?.totalPages ?? 0;
        },

        error: (error) => {

          this.productos = [];
          this.totalElementos = 0;
          this.totalPaginas = 0;

          this.mensajeError =
            error?.error?.message ||
            'No fue posible consultar los productos.';
        }

      });
  }

  aplicarFiltros(): void {

    this.paginaActual = 0;

    this.mensajeError = '';
    this.mensajeExito = '';

    this.cargarProductos();
  }

  limpiarFiltros(): void {

    this.codigo = '';
    this.nombre = '';
    this.tipoTela = '';
    this.estado = null;

    this.paginaActual = 0;

    this.mensajeError = '';
    this.mensajeExito = '';

    this.cargarProductos();
  }

  cambiarPagina(
    pagina: number
  ): void {

    if (pagina < 0) {
      return;
    }

    if (pagina >= this.totalPaginas) {
      return;
    }

    this.paginaActual = pagina;

    this.cargarProductos();
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

  nuevoProducto(): void {

    this.editando = false;

    this.productoId = null;

    this.limpiarFormulario();

    this.mensajeError = '';
    this.mensajeExito = '';

    this.mostrarFormulario = true;
  }

  editarProducto(
    producto: Product
  ): void {

    this.editando = true;

    this.productoId = producto.id;

    this.formularioCodigo =
      producto.code;

    this.formularioNombre =
      producto.name;

    this.formularioTipoTela =
      producto.fabricType;

    this.formularioComposicion =
      producto.composition;

    this.formularioActivo =
      producto.active;

    this.mensajeError = '';
    this.mensajeExito = '';

    this.mostrarFormulario = true;
  }

  cerrarFormulario(): void {

    if (this.guardando) {
      return;
    }

    this.mostrarFormulario = false;
  }

  cancelar(): void {

    this.cerrarFormulario();
  }

  limpiarFormulario(): void {

    this.formularioCodigo = '';
    this.formularioNombre = '';
    this.formularioTipoTela = '';
    this.formularioComposicion = '';
    this.formularioActivo = true;

    this.guardando = false;
  }

  validarFormulario(): boolean {

    this.mensajeError = '';

    if (!this.formularioCodigo.trim()) {

      this.mensajeError =
        'El código del producto es obligatorio.';

      return false;
    }

    if (this.formularioCodigo.trim().length > 50) {

      this.mensajeError =
        'El código no puede superar los 50 caracteres.';

      return false;
    }

    if (!this.formularioNombre.trim()) {

      this.mensajeError =
        'El nombre del producto es obligatorio.';

      return false;
    }

    if (this.formularioNombre.trim().length > 150) {

      this.mensajeError =
        'El nombre no puede superar los 150 caracteres.';

      return false;
    }

    if (!this.formularioTipoTela.trim()) {

      this.mensajeError =
        'El tipo de tela es obligatorio.';

      return false;
    }

    if (this.formularioTipoTela.trim().length > 100) {

      this.mensajeError =
        'El tipo de tela no puede superar los 100 caracteres.';

      return false;
    }

    if (!this.formularioComposicion.trim()) {

      this.mensajeError =
        'La composición es obligatoria.';

      return false;
    }

    if (this.formularioComposicion.trim().length > 500) {

      this.mensajeError =
        'La composición no puede superar los 500 caracteres.';

      return false;
    }

    return true;
  }

  guardarProducto(): void {

    if (!this.validarFormulario()) {
      return;
    }

    const request: ProductRequest = {

      code:
        this.formularioCodigo.trim(),

      name:
        this.formularioNombre.trim(),

      fabricType:
        this.formularioTipoTela.trim(),

      composition:
        this.formularioComposicion.trim(),

      active:
        this.formularioActivo
    };

    this.guardando = true;

    this.mensajeError = '';
    this.mensajeExito = '';

    const peticion = this.editando && this.productoId !== null
      ? this.productoService.actualizar(
          this.productoId,
          request
        )
      : this.productoService.crear(
          request
        );

    peticion
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
            (
              this.editando
                ? 'Producto actualizado correctamente.'
                : 'Producto creado correctamente.'
            );

          this.cargarProductos();
        },

        error: (error) => {

          this.mostrarFormulario = false;

          this.mensajeError =
            error?.error?.message ||
            (
              this.editando
                ? 'No fue posible actualizar el producto.'
                : 'No fue posible crear el producto.'
            );
        }

      });
  }

  cambiarEstado(
    producto: Product
  ): void {

    this.mensajeError = '';
    this.mensajeExito = '';

    this.productoService
      .cambiarEstado(
        producto.id,
        !producto.active
      )
      .subscribe({

        next: (response) => {

          this.mensajeExito =
            response.message ||
            'Estado del producto actualizado correctamente.';

          this.cargarProductos();
        },

        error: (error) => {

          this.mensajeError =
            error?.error?.message ||
            'No fue posible actualizar el estado del producto.';
        }

      });
  }

  obtenerEstado(
    producto: Product
  ): string {

    return producto.active
      ? 'Activo'
      : 'Inactivo';
  }

}