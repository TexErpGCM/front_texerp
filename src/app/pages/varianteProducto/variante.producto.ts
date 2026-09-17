import {
  ChangeDetectorRef,
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

import {
  VarianteproductoService,
  Variante,
  CrearVarianteRequest,
  VarianteFiltros,
  Producto
} from '../../core/services/variante.producto.service';
import { ProductService } from '../../core/services/producto.service';
import { LoadingComponent } from '../../layout/loading/loading.component';


@Component({
  selector: 'app-variantes',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LoadingComponent
  ],
  templateUrl: './variante.producto.html',
  styleUrl: './variante.producto.scss'
})
export class VariantesComponent implements OnInit {

  private readonly variantService = inject(
    VarianteproductoService
  );
  private readonly productService = inject(
    ProductService
  );

  private readonly cdr = inject(ChangeDetectorRef);

  productId: number | null = null;
  productos: Producto[] = [];

  productCode = '';
  cargandoVariantes = false;

  variantes: Variante[] = [];

  varianteSeleccionada: Variante | null = null;

  paginaActual = 0;
  tamanioPagina = 20;
  totalElementos = 0;
  totalPaginas = 0;

  filtroProductoId: number | undefined = undefined;
  filtroSku = '';
  filtroColor = '';
  filtroActivo: boolean | undefined = undefined;

  mostrarFormulario = false;
  modoEdicion = false;
  guardando = false;

  errorFormulario = '';
  mensajeExito = '';

  formulario: CrearVarianteRequest = this.crearFormulario();

  ngOnInit(): void {
    this.cargarProductos();
    this.cargarVariantes();
  }

  cargarVariantes(): void {

    this.cargandoVariantes = true;

    const filtros: VarianteFiltros = {
      sku: this.filtroSku,
      color: this.filtroColor,
      active: this.filtroActivo,
      page: this.paginaActual,
      size: this.tamanioPagina
    };

    if (this.filtroProductoId !== undefined) {
      filtros.productId = this.filtroProductoId;
    }

    this.variantService
      .obtenerVariantes(filtros)
      .pipe(
        finalize(() => {
          this.cargandoVariantes = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: response => {

          this.variantes = response.data.content;
          this.totalElementos = response.data.totalElements;
          this.totalPaginas = response.data.totalPages;
        },

        error: error => {
          this.manejarError(error);
        }
      });
  }

  cargarProductos(): void {
    this.productService.obtenerProductosParaSelector().subscribe({
      next: productos => {
        this.productos = productos;
      },
      error: error => {
        console.error('Error al cargar productos', error);
      }
    });
  }

  buscar(): void {
    this.paginaActual = 0;
    this.cargarVariantes();
  }

  limpiarFiltros(): void {
    this.filtroSku = '';
    this.filtroColor = '';
    this.filtroActivo = undefined;
    this.paginaActual = 0;

    this.cargarVariantes();
  }

  cambiarPagina(pagina: number): void {

    if (
      pagina < 0 ||
      pagina >= this.totalPaginas
    ) {
      return;
    }

    this.paginaActual = pagina;
    this.cargarVariantes();
  }

  nuevaVariante(): void {

    this.modoEdicion = false;
    this.varianteSeleccionada = null;

    this.errorFormulario = '';
    this.mensajeExito = '';
    this.productId = null;
    this.formulario = this.crearFormulario();

    this.mostrarFormulario = true;
  }

  editar(variante: Variante): void {

    this.modoEdicion = true;
    this.varianteSeleccionada = variante;
    this.productId = variante.productId;
    this.errorFormulario = '';
    this.mensajeExito = '';

    this.formulario = {
      sku: variante.sku,
      color: variante.color,
      pattern: variante.pattern ?? '',
      width: variante.width,
      unitCode: variante.unitCode,
      cost: variante.cost,
      salePrice: variante.salePrice,
      active: variante.active
    };

    this.mostrarFormulario = true;
  }

  guardar(): void {

    this.errorFormulario = '';
    this.mensajeExito = '';

    if (!this.validarFormulario()) {
      return;
    }

    if (
      this.modoEdicion &&
      this.varianteSeleccionada
    ) {
      this.actualizar();
      return;
    }

    this.crear();
  }

  private crear(): void {

    if (this.productId === null) {
      this.errorFormulario =
        'Debe seleccionar un producto.';
      return;
    }

    this.guardando = true;

    this.variantService
      .crearVariante(
        this.productId,
        this.formulario
      )
      .pipe(
        finalize(() => {
          this.guardando = false;
        })
      )
      .subscribe({
        next: response => {

          this.mostrarFormulario = false;

          this.mensajeExito =
            response.message ||
            'Variante creada correctamente.';

          this.cargarVariantes();
        },
        error: error => {
          this.manejarError(error);
        }
      });
  }

  private actualizar(): void {

    if (!this.varianteSeleccionada) {
      return;
    }

    this.guardando = true;

    this.variantService
      .actualizarVariante(
        this.varianteSeleccionada.id,
        this.formulario
      )
      .pipe(
        finalize(() => {
          this.guardando = false;
        })
      )
      .subscribe({
        next: response => {

          this.mostrarFormulario = false;

          this.mensajeExito =
            response.message ||
            'Variante actualizada correctamente.';

          this.cargarVariantes();
        },
        error: error => {
          this.manejarError(error);
        }
      });
  }

  cambiarEstado(variante: Variante): void {

    const nuevoEstado = !variante.active;

    this.variantService
      .actualizarEstado(
        variante.id,
        nuevoEstado
      )
      .subscribe({
        next: response => {
          variante.active = response.data.active;
          this.mensajeExito = response.message || 'Estado de la variante actualizado correctamente.';
          this.cargarVariantes();
        },
        error: error => {
          this.manejarError(error);
        }
      });
  }

  cancelar(): void {

    if (this.guardando) {
      return;
    }

    this.mostrarFormulario = false;
    this.errorFormulario = '';
    this.varianteSeleccionada = null;
  }

  validarFormulario(): boolean {

    const sku = this.formulario.sku.trim();
    const color = this.formulario.color.trim();
    const pattern = this.formulario.pattern?.trim() ?? '';
    const unitCode = this.formulario.unitCode.trim();

    if (!sku) {
      this.errorFormulario =
        'El SKU es obligatorio.';
      return false;
    }

    if (sku.length > 60) {
      this.errorFormulario =
        'El SKU debe tener máximo 60 caracteres.';
      return false;
    }

    if (!color) {
      this.errorFormulario =
        'El color es obligatorio.';
      return false;
    }

    if (color.length > 80) {
      this.errorFormulario =
        'El color debe tener máximo 80 caracteres.';
      return false;
    }

    if (pattern.length > 120) {
      this.errorFormulario =
        'El patrón debe tener máximo 120 caracteres.';
      return false;
    }

    if (
      this.formulario.width === null ||
      this.formulario.width < 0
    ) {
      this.errorFormulario =
        'El ancho debe ser mayor o igual a cero.';
      return false;
    }

    if (!unitCode) {
      this.errorFormulario =
        'La unidad de medida es obligatoria.';
      return false;
    }

    if (unitCode.length > 20) {
      this.errorFormulario =
        'La unidad de medida debe tener máximo 20 caracteres.';
      return false;
    }

    if (
      this.formulario.cost === null ||
      this.formulario.cost < 0
    ) {
      this.errorFormulario =
        'El costo debe ser mayor o igual a cero.';
      return false;
    }

    if (
      this.formulario.salePrice === null ||
      this.formulario.salePrice < 0
    ) {
      this.errorFormulario =
        'El precio de venta debe ser mayor o igual a cero.';
      return false;
    }

    this.formulario.sku = sku;
    this.formulario.color = color;
    this.formulario.pattern = pattern;
    this.formulario.unitCode = unitCode;

    return true;
  }

  private crearFormulario(): CrearVarianteRequest {
    return {
      sku: '',
      color: '',
      pattern: '',
      width: 0,
      unitCode: '',
      cost: 0,
      salePrice: 0,
      active: true
    };
  }

  private manejarError(error: any): void {

    console.error(
      'Error en variantes:',
      error
    );

    switch (error.status) {

      case 400:
        this.errorFormulario =
          error.error?.message ||
          'Los datos enviados no son válidos.';
        break;

      case 403:
        this.errorFormulario =
          'No tiene permisos para realizar esta operación.';
        break;

      case 404:
        this.errorFormulario =
          error.error?.message ||
          'La variante o el producto no fueron encontrados.';
        break;

      case 409:
        this.errorFormulario =
          error.error?.message ||
          'El SKU ya se encuentra registrado.';
        break;

      default:
        this.errorFormulario =
          error.error?.message ||
          'Ocurrió un error al procesar la solicitud.';
    }
  }
}