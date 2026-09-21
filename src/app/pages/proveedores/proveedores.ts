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
  ProveedorService,
  Proveedor,
  CrearProveedorRequest
} from '../../core/services/proveedor.service';

@Component({
  selector: 'app-proveedores',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './proveedores.html',
  styleUrl: './proveedores.scss'
})
export class ProveedoresComponent implements OnInit {

  private fb = inject(FormBuilder);
  private proveedorService = inject(ProveedorService);
  private cdr = inject(ChangeDetectorRef);

  proveedores: Proveedor[] = [];

  cargando = false;
  guardando = false;

  mostrarFormulario = false;
  modoEdicion = false;

  proveedorEditandoId: number | null = null;

  mensajeExito = '';
  mensajeError = '';

  filtroForm!: FormGroup;
  proveedorForm!: FormGroup;

  paginaActual = 0;
  tamanioPagina = 20;

  totalElementos = 0;
  totalPaginas = 0;

  ngOnInit(): void {
    this.inicializarFormularios();
    this.cargarProveedores();
  }

  private inicializarFormularios(): void {

    this.filtroForm = this.fb.group({
      taxId: [''],
      name: [''],
      active: [null]
    });

    this.proveedorForm = this.fb.group({
      taxId: [
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
      email: [
        '',
        [
          Validators.required,
          Validators.email,
          Validators.maxLength(150)
        ]
      ]
    });
  }

  cargarProveedores(): void {

    this.cargando = true;
    this.mensajeError = '';

    const filtros = this.filtroForm.value;

    this.proveedorService.listar(
      {
        taxId: filtros.taxId,
        name: filtros.name,
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
            respuesta.message ||
            'No fue posible cargar los proveedores.';
          return;
        }

        const pagina = respuesta.data;

        this.proveedores = pagina.content;

        this.paginaActual = pagina.page;
        this.tamanioPagina = pagina.size;

        this.totalElementos = pagina.totalElements;
        this.totalPaginas = pagina.totalPages;
      },

      error: (error) => {

        this.mensajeError = this.obtenerMensajeError(
          error,
          'No fue posible cargar los proveedores.'
        );
      }
    });
  }

  buscar(): void {
    this.paginaActual = 0;
    this.cargarProveedores();
  }

  limpiarFiltros(): void {

    this.filtroForm.reset({
      taxId: '',
      name: '',
      active: null
    });

    this.paginaActual = 0;

    this.cargarProveedores();
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

    this.cargarProveedores();
  }

  nuevoProveedor(): void {

    this.modoEdicion = false;
    this.proveedorEditandoId = null;

    this.mensajeError = '';

    this.proveedorForm.reset({
      taxId: '',
      name: '',
      email: ''
    });

    this.proveedorForm.get('taxId')?.enable();

    this.mostrarFormulario = true;
  }

  editar(proveedor: Proveedor): void {

    this.modoEdicion = true;
    this.proveedorEditandoId = proveedor.id;

    this.mensajeError = '';

    this.proveedorForm.patchValue({
      taxId: proveedor.taxId,
      name: proveedor.name,
      email: proveedor.email
    });

    /*
     * La identificación tributaria es única,
     * por lo que no se modifica durante la edición.
     */
    this.proveedorForm.get('taxId')?.disable();

    this.mostrarFormulario = true;
  }

  guardar(): void {

    if (this.proveedorForm.invalid) {
      this.proveedorForm.markAllAsTouched();
      return;
    }

    this.guardando = true;
    this.mensajeError = '';

    const valores = this.proveedorForm.getRawValue();

    const request: CrearProveedorRequest = {
      taxId: valores.taxId.trim(),
      name: valores.name.trim(),
      email: valores.email.trim()
    };

    const peticion =
      this.modoEdicion && this.proveedorEditandoId
        ? this.proveedorService.actualizar(
            this.proveedorEditandoId,
            request
          )
        : this.proveedorService.crear(request);

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
              respuesta.message ||
              'No fue posible guardar el proveedor.';
            return;
          }

          this.mostrarFormulario = false;

          this.mensajeExito =
            respuesta.message ||
            (
              this.modoEdicion
                ? 'Proveedor actualizado correctamente.'
                : 'Proveedor creado correctamente.'
            );

          this.cargarProveedores();
        },

        error: (error) => {

          this.mensajeError =
            this.obtenerMensajeError(
              error,
              'No fue posible guardar el proveedor.'
            );
        }
      });
  }

  cambiarEstado(proveedor: Proveedor): void {

    const nuevoEstado = !proveedor.active;

    this.mensajeError = '';

    this.proveedorService
      .cambiarEstado(
        proveedor.id,
        nuevoEstado
      )
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
              'No fue posible actualizar el estado del proveedor.';
            return;
          }

          this.mensajeExito =
            respuesta.message ||
            'Estado del proveedor actualizado correctamente.';

          this.cargarProveedores();
        },

        error: (error) => {

          this.mensajeError =
            this.obtenerMensajeError(
              error,
              'No fue posible actualizar el estado del proveedor.'
            );
        }
      });
  }

  cancelar(): void {

    this.mostrarFormulario = false;
    this.mensajeError = '';

    this.proveedorForm.reset({
      taxId: '',
      name: '',
      email: ''
    });

    this.proveedorForm.get('taxId')?.enable();
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