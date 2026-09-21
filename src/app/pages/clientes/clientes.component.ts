import {
  ChangeDetectorRef,
  Component,
  OnInit,
  inject
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import { finalize } from 'rxjs';

import {
  ClienteService,
  Cliente,
  TipoCliente,
  CrearClienteRequest
} from '../../core/services/cliente.service';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './clientes.component.html',
  styleUrl: './clientes.component.scss'
})
export class ClientesComponent implements OnInit {

  private readonly clienteService = inject(ClienteService);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);

  clientes: Cliente[] = [];
  clientesFiltrados: Cliente[] = [];

  cargando = false;
  guardando = false;

  mensajeExito = '';
  mensajeError = '';

  mostrarFormulario = false;
  modoEdicion = false;
  clienteEditandoId: number | null = null;

  filtroForm!: FormGroup;
  clienteForm!: FormGroup;

  paginaActual = 0;
  tamanioPagina = 5;
  totalClientes = 0;
  totalPaginas = 0;

  ngOnInit(): void {
    this.inicializarFormularios();
    this.cargarClientes();
  }

  private inicializarFormularios(): void {

    this.filtroForm = this.fb.group({
      document: [''],
      name: [''],
      type: [''],
      active: [null]
    });

    this.clienteForm = this.fb.group({

      document: [
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

      type: [
        'NATURAL' as TipoCliente,
        Validators.required
      ],

      email: [
        '',
        [
          Validators.email,
          Validators.maxLength(150)
        ]
      ],

      phone: [
        '',
        Validators.maxLength(30)
      ],

      classification: [
        '',
        Validators.maxLength(80)
      ],

      active: [true]
    });
  }

  cargarClientes(): void {

    this.cargando = true;
    this.mensajeError = '';

    const filtros = this.filtroForm.value;

    this.clienteService
      .listar(
        {
          document: filtros.document,
          name: filtros.name,
          type: filtros.type,
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

        next: response => {

          if (!response.success || !response.data) {

            this.mensajeError =
              response.message ||
              'No fue posible cargar los clientes.';

            this.clientes = [];
            this.clientesFiltrados = [];
            this.totalClientes = 0;
            this.totalPaginas = 0;

            return;
          }

          this.clientes =
            response.data.content ?? [];

          this.clientesFiltrados =
            [...this.clientes];

          this.paginaActual =
            response.data.page ?? this.paginaActual;

          this.totalClientes =
            response.data.totalElements ?? 0;

          this.totalPaginas =
            response.data.totalPages ?? 0;
        },

        error: error => {

          this.mensajeError =
            this.obtenerMensajeError(
              error,
              'No fue posible cargar los clientes.'
            );

          this.clientes = [];
          this.clientesFiltrados = [];
          this.totalClientes = 0;
          this.totalPaginas = 0;
        }
      });
  }

  aplicarFiltros(): void {

    this.paginaActual = 0;

    this.cargarClientes();
  }

  limpiarFiltros(): void {

    this.filtroForm.reset({
      document: '',
      name: '',
      type: '',
      active: null
    });

    this.paginaActual = 0;

    this.cargarClientes();
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

    this.cargarClientes();
  }

  nuevoCliente(): void {

    this.modoEdicion = false;
    this.clienteEditandoId = null;

    this.mensajeError = '';
    this.mensajeExito = '';

    this.clienteForm.reset({
      document: '',
      name: '',
      type: 'NATURAL',
      email: '',
      phone: '',
      classification: '',
      active: true
    });

    this.mostrarFormulario = true;

    this.cdr.detectChanges();
  }

  editarCliente(cliente: Cliente): void {

    if (!cliente.id) {
      return;
    }

    this.modoEdicion = true;
    this.clienteEditandoId = cliente.id;

    this.mensajeError = '';
    this.mensajeExito = '';

    this.clienteForm.patchValue({
      document: cliente.document,
      name: cliente.name,
      type: cliente.type,
      email: cliente.email ?? '',
      phone: cliente.phone ?? '',
      classification: cliente.classification ?? '',
      active: cliente.active
    });

    this.mostrarFormulario = true;

    this.cdr.detectChanges();
  }

  cancelar(): void {

    this.mostrarFormulario = false;

    this.mensajeError = '';

    this.clienteEditandoId = null;

    this.cdr.detectChanges();
  }

  guardar(): void {

    this.mensajeError = '';

    if (this.clienteForm.invalid) {

      this.clienteForm.markAllAsTouched();

      return;
    }

    this.guardando = true;

    const formValue =
      this.clienteForm.value;

    const request: CrearClienteRequest = {

      document:
        formValue.document.trim(),

      name:
        formValue.name.trim(),

      type:
        formValue.type,

      email:
        formValue.email?.trim() || null,

      phone:
        formValue.phone?.trim() || null,

      classification:
        formValue.classification?.trim() || null,

      active:
        formValue.active
    };

    const peticion =
      this.modoEdicion &&
      this.clienteEditandoId !== null

        ? this.clienteService.actualizar(
            this.clienteEditandoId,
            request
          )

        : this.clienteService.crear(
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

        next: response => {

          if (!response.success) {

            this.mensajeError =
              response.message ||
              'No fue posible guardar el cliente.';

            return;
          }

          this.mensajeExito =
            response.message ||
            (
              this.modoEdicion
                ? 'Cliente actualizado correctamente.'
                : 'Cliente creado correctamente.'
            );

          this.mostrarFormulario = false;
          this.clienteEditandoId = null;

          /*
           * Volvemos a consultar el backend
           * para actualizar la tabla.
           */
          this.cargarClientes();
        },

        error: error => {

          this.mensajeError =
            this.obtenerMensajeError(
              error,
              'No fue posible guardar el cliente.'
            );
        }
      });
  }

  cambiarEstado(cliente: Cliente): void {

    if (!cliente.id) {
      return;
    }

    const nuevoEstado =
      !cliente.active;

    this.cargando = true;
    this.mensajeError = '';

    this.clienteService
      .cambiarEstado(
        cliente.id,
        nuevoEstado
      )
      .pipe(
        finalize(() => {
          this.cargando = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({

        next: response => {

          if (!response.success) {

            this.mensajeError =
              response.message ||
              'No fue posible cambiar el estado.';

            return;
          }

          /*
           * Actualiza inmediatamente la fila.
           */
          cliente.active = nuevoEstado;

          this.clientesFiltrados =
            [...this.clientesFiltrados];

          this.mensajeExito =
            response.message ||
            'Estado actualizado correctamente.';

          this.cdr.detectChanges();

          /*
           * Sincroniza nuevamente con el backend.
           */
          this.cargarClientes();
        },

        error: error => {

          this.mensajeError =
            this.obtenerMensajeError(
              error,
              'No fue posible actualizar el estado del cliente.'
            );
        }
      });
  }

  private obtenerMensajeError(
    error: any,
    mensajePorDefecto: string
  ): string {

    if (
      error?.error?.message &&
      typeof error.error.message === 'string'
    ) {
      return error.error.message;
    }

    if (
      error?.error?.detail &&
      typeof error.error.detail === 'string'
    ) {
      return error.error.detail;
    }

    if (error?.status === 400) {

      return (
        error?.error?.message ||
        'Los datos enviados no son válidos. Revisa la información.'
      );
    }

    if (error?.status === 401) {

      return 'Tu sesión no es válida o ha expirado. Inicia sesión nuevamente.';
    }

    if (error?.status === 403) {

      return 'No tienes permisos para realizar esta acción.';
    }

    if (error?.status === 404) {

      return 'El cliente que intentas modificar no fue encontrado.';
    }

    if (error?.status === 409) {

      return (
        error?.error?.message ||
        'Ya existe un cliente registrado con esos datos.'
      );
    }

    if (error?.status >= 500) {

      return 'Ocurrió un error interno en el servidor. Inténtalo nuevamente.';
    }

    return mensajePorDefecto;
  }
}