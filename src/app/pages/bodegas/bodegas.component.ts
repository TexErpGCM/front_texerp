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
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import {
  finalize
} from 'rxjs';

import {
  BodegaService,
  Bodega,
  CrearBodegaRequest
} from '../../core/services/bodega.service';

@Component({
  selector: 'app-bodegas',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './bodegas.component.html',
  styleUrl: './bodegas.component.scss'
})
export class BodegasComponent implements OnInit {

  private fb = inject(FormBuilder);
  private bodegaService = inject(BodegaService);
  private cdr = inject(ChangeDetectorRef);

  bodegas: Bodega[] = [];
  bodegasFiltradas: Bodega[] = [];

  cargando = false;
  guardando = false;

  mostrarFormulario = false;
  modoEdicion = false;
  bodegaEditandoId: number | null = null;

  mensajeExito = '';
  mensajeError = '';

  filtroForm!: FormGroup;
  bodegaForm!: FormGroup;

  paginaActual = 0;
  tamanioPagina = 20;

  totalPaginas = 0;
  totalElementos = 0;

  ngOnInit(): void {
    this.inicializarFormularios();
    this.cargarBodegas();
  }

  private inicializarFormularios(): void {

    this.filtroForm = this.fb.group({
      code: [''],
      name: [''],
      location: [''],
      active: [null]
    });

    this.bodegaForm = this.fb.group({
      code: [
        '',
        [
          Validators.required,
          Validators.maxLength(50)
        ]
      ],
      name: [
        '',
        [
          Validators.required,
          Validators.maxLength(150)
        ]
      ],
      location: [
        '',
        [
          Validators.required,
          Validators.maxLength(200)
        ]
      ]
    });
  }

  cargarBodegas(): void {

    this.cargando = true;
    this.mensajeError = '';

    const filtros = this.filtroForm.value;

    this.bodegaService.listar(
      {
        code: filtros.code,
        name: filtros.name,
        location: filtros.location,
        active: filtros.active
      },
      this.paginaActual,
      this.tamanioPagina
    )
    .pipe(
      finalize(() => {
        this.cargando = false;
        this.cdr.detectChanges();
      })
    )
    .subscribe({
      next: (respuesta) => {

        if (!respuesta.success) {
          this.mensajeError =
            respuesta.message || 'No fue posible cargar las bodegas.';
          return;
        }

        const pagina = respuesta.data;

        this.bodegas = pagina.content;
        this.bodegasFiltradas = pagina.content;

        this.paginaActual = pagina.page;
        this.tamanioPagina = pagina.size;
        this.totalElementos = pagina.totalElements;
        this.totalPaginas = pagina.totalPages;
      },

      error: (error) => {
        this.mensajeError = this.obtenerMensajeError(
          error,
          'No fue posible cargar las bodegas.'
        );
      }
    });
  }

  aplicarFiltros(): void {
    this.paginaActual = 0;
    this.cargarBodegas();
  }

  limpiarFiltros(): void {

    this.filtroForm.reset({
      code: '',
      name: '',
      location: '',
      active: null
    });

    this.paginaActual = 0;
    this.cargarBodegas();
  }

  cambiarPagina(pagina: number): void {

    if (
      pagina < 0 ||
      pagina >= this.totalPaginas ||
      pagina === this.paginaActual
    ) {
      return;
    }

    this.paginaActual = pagina;
    this.cargarBodegas();
  }

  nuevaBodega(): void {

    this.modoEdicion = false;
    this.bodegaEditandoId = null;

    this.mensajeError = '';

    this.bodegaForm.reset({
      code: '',
      name: '',
      location: ''
    });

    this.bodegaForm.get('code')?.enable();

    this.mostrarFormulario = true;
  }

  editarBodega(bodega: Bodega): void {

    this.modoEdicion = true;
    this.bodegaEditandoId = bodega.id;

    this.mensajeError = '';

    this.bodegaForm.patchValue({
      code: bodega.code,
      name: bodega.name,
      location: bodega.location
    });

    /*
     * El código no se modifica en edición.
     * Esto también evita cambiar la clave única
     * definida en el backend.
     */
    this.bodegaForm.get('code')?.disable();

    this.mostrarFormulario = true;
  }

  guardar(): void {

    if (this.bodegaForm.invalid) {
      this.bodegaForm.markAllAsTouched();
      return;
    }

    this.guardando = true;
    this.mensajeError = '';

    const valores = this.bodegaForm.getRawValue();

    const request: CrearBodegaRequest = {
      code: valores.code.trim(),
      name: valores.name.trim(),
      location: valores.location.trim()
    };

    const peticion = this.modoEdicion && this.bodegaEditandoId
      ? this.bodegaService.actualizar(
          this.bodegaEditandoId,
          request
        )
      : this.bodegaService.crear(request);

    peticion
      .pipe(
        finalize(() => {
          this.guardando = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (respuesta) => {

          if (!respuesta.success) {
            this.mensajeError =
              respuesta.message || 'No fue posible guardar la bodega.';
            return;
          }

          this.mostrarFormulario = false;

          this.mensajeExito = respuesta.message ||
            (
              this.modoEdicion
                ? 'Bodega actualizada correctamente.'
                : 'Bodega creada correctamente.'
            );

          this.cargarBodegas();
        },

        error: (error) => {
          this.mensajeError = this.obtenerMensajeError(
            error,
            'No fue posible guardar la bodega.'
          );
        }
      });
  }

  cambiarEstado(bodega: Bodega): void {

    const nuevoEstado = !bodega.active;

    this.mensajeError = '';

    this.bodegaService
      .cambiarEstado(bodega.id, nuevoEstado)
      .pipe(
        finalize(() => {
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (respuesta) => {

          if (!respuesta.success) {
            this.mensajeError =
              respuesta.message ||
              'No fue posible actualizar el estado de la bodega.';
            return;
          }

          this.mensajeExito = respuesta.message ||
            'Estado de la bodega actualizado correctamente.';

          this.cargarBodegas();
        },

        error: (error) => {
          this.mensajeError = this.obtenerMensajeError(
            error,
            'No fue posible actualizar el estado de la bodega.'
          );
        }
      });
  }

  cancelar(): void {

    this.mostrarFormulario = false;
    this.mensajeError = '';

    this.bodegaForm.reset({
      code: '',
      name: '',
      location: ''
    });

    this.bodegaForm.get('code')?.enable();
  }

  private obtenerMensajeError(
    error: any,
    mensajeDefault: string
  ): string {

    return (
      error?.error?.message ||
      error?.error?.data?.message ||
      error?.message ||
      mensajeDefault
    );
  }
}