import {
  ChangeDetectorRef,
  Component,
  inject,
  OnInit
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import {
  UserService,
  Usuario,
  CrearUsuarioRequest,
  ActualizarUsuarioRequest
} from '../../core/services/user.services';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.scss'
})
export class Usuarios implements OnInit {

  private readonly userService = inject(UserService);
  private readonly cdr = inject(ChangeDetectorRef);

  usuarios: Usuario[] = [];
  usuariosFiltrados: Usuario[] = [];
  busqueda = '';

  cargando = false;
  mensajeError = '';

  paginaActual = 0;
  tamanioPagina = 10;
  totalUsuarios = 0;
  totalPaginas = 0;

  mostrarFormulario = false;
  modoEdicion = false;

  formulario = {
    id: 0,
    name: '',
    username: '',
    email: '',
    password: '',
    role: 'ADMINISTRADOR',
    active: true
  };

  usuarioSeleccionado: Usuario | null = null;

  mostrarModalError = false;
  tituloError = '';
  detalleError = '';

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  cargarUsuarios(): void {
    this.cargando = true;
    this.mensajeError = '';

    this.userService
      .obtenerUsuarios({
        page: this.paginaActual,
        size: this.tamanioPagina
      })
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
              'No fue posible cargar los usuarios';

            this.usuarios = [];
            this.usuariosFiltrados = [];
            this.totalUsuarios = 0;
            this.totalPaginas = 0;
            return;
          }

          this.usuarios =
            response.data.content ?? [];

          this.totalUsuarios =
            response.data.totalElements ?? 0;

          this.totalPaginas =
            response.data.totalPages ?? 0;

          this.filtrarUsuarios();
        },

        error: error => {
          this.mensajeError =
            this.obtenerMensajeError(
              error,
              'No fue posible cargar los usuarios'
            );

          this.usuarios = [];
          this.usuariosFiltrados = [];
          this.totalUsuarios = 0;
          this.totalPaginas = 0;

          this.mostrarError(
            'Error al cargar usuarios',
            this.mensajeError
          );
        }
      });
  }

  filtrarUsuarios(): void {
    const texto = this.busqueda
      .trim()
      .toLowerCase();

    if (!texto) {
      this.usuariosFiltrados = [...this.usuarios];
      return;
    }

    this.usuariosFiltrados = this.usuarios.filter(usuario =>
      usuario.name.toLowerCase().includes(texto) ||
      usuario.username.toLowerCase().includes(texto) ||
      usuario.email.toLowerCase().includes(texto) ||
      usuario.role.toLowerCase().includes(texto)
    );

    this.cdr.detectChanges();
  }

  irPagina(pagina: number): void {
    if (
      pagina < 0 ||
      pagina >= this.totalPaginas ||
      pagina === this.paginaActual
    ) {
      return;
    }

    this.paginaActual = pagina;
    this.cargarUsuarios();
  }

  paginaAnterior(): void {
    if (this.paginaActual <= 0) {
      return;
    }

    this.paginaActual--;
    this.cargarUsuarios();
  }

  paginaSiguiente(): void {
    if (this.paginaActual >= this.totalPaginas - 1) {
      return;
    }

    this.paginaActual++;
    this.cargarUsuarios();
  }

  abrirCrear(): void {
    this.modoEdicion = false;
    this.mensajeError = '';

    this.formulario = {
      id: 0,
      name: '',
      username: '',
      email: '',
      password: '',
      role: 'ADMINISTRADOR',
      active: true
    };

    this.mostrarFormulario = true;
  }

  abrirEditar(usuario: Usuario): void {
    this.modoEdicion = true;
    this.mensajeError = '';

    this.formulario = {
      id: usuario.id,
      name: usuario.name,
      username: usuario.username,
      email: usuario.email,
      password: '',
      role: usuario.role,
      active: usuario.active
    };

    this.mostrarFormulario = true;
  }

  cerrarFormulario(): void {
    this.mostrarFormulario = false;
    this.mensajeError = '';
  }

  guardarUsuario(): void {
    this.mensajeError = '';

    if (!this.formulario.name.trim()) {
      this.mensajeError = 'El nombre es obligatorio';
      return;
    }

    if (!this.formulario.username.trim()) {
      this.mensajeError =
        'El nombre de usuario es obligatorio';
      return;
    }

    if (!this.formulario.email.trim()) {
      this.mensajeError = 'El correo es obligatorio';
      return;
    }

    if (!this.esEmailValido(this.formulario.email)) {
      this.mensajeError =
        'Ingresa un correo electrónico válido';
      return;
    }

    if (this.modoEdicion) {
      const request: ActualizarUsuarioRequest = {
        name: this.formulario.name.trim(),
        username: this.formulario.username
          .trim()
          .toLowerCase(),
        email: this.formulario.email
          .trim()
          .toLowerCase(),
        role: this.formulario.role
      };

      this.cargando = true;

      this.userService
        .actualizarUsuario(
          this.formulario.id,
          request
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
              const mensaje =
                response.message ||
                'No fue posible actualizar el usuario';

              this.mensajeError = mensaje;

              this.mostrarError(
                'No se pudo actualizar el usuario',
                mensaje
              );

              return;
            }

            this.cerrarFormulario();
            this.cargarUsuarios();
          },

          error: error => {
            const mensaje =
              this.obtenerMensajeError(
                error,
                'No fue posible actualizar el usuario'
              );

            this.mensajeError = mensaje;

            this.mostrarError(
              'No se pudo actualizar el usuario',
              mensaje
            );
          }
        });

      return;
    }

    if (!this.formulario.password.trim()) {
      this.mensajeError =
        'La contraseña es obligatoria';
      return;
    }

    if (this.formulario.password.length < 6) {
      this.mensajeError =
        'La contraseña debe tener al menos 6 caracteres';
      return;
    }

    const request: CrearUsuarioRequest = {
      name: this.formulario.name.trim(),
      username: this.formulario.username
        .trim()
        .toLowerCase(),
      email: this.formulario.email
        .trim()
        .toLowerCase(),
      password: this.formulario.password,
      role: this.formulario.role,
      active: this.formulario.active
    };

    this.cargando = true;

    this.userService
      .crearUsuario(request)
      .pipe(
        finalize(() => {
          this.cargando = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: response => {
          if (!response.success) {
            const mensaje =
              response.message ||
              'No fue posible crear el usuario';

            this.mensajeError = mensaje;

            this.mostrarError(
              'No se pudo crear el usuario',
              mensaje
            );

            return;
          }

          this.cerrarFormulario();
          this.paginaActual = 0;
          this.cargarUsuarios();
        },

        error: error => {
          const mensaje =
            this.obtenerMensajeError(
              error,
              'No fue posible crear el usuario'
            );

          this.mensajeError = mensaje;

          this.mostrarError(
            'No se pudo crear el usuario',
            mensaje
          );
        }
      });
  }

  confirmarEliminar(usuario: Usuario): void {
    this.usuarioSeleccionado = usuario;
  }

  cancelarEliminar(): void {
    this.usuarioSeleccionado = null;
  }

  eliminarUsuario(id: number): void {
    this.userService
      .eliminarUsuario(id)
      .subscribe({
        next: response => {
          if (!response.success) {
            this.mensajeError =
              response.message ||
              'No fue posible eliminar el usuario';
            return;
          }

          this.usuarioSeleccionado = null;
          this.cargarUsuarios();
        },

        error: error => {
          this.mensajeError =
            error.error?.message ||
            'Ocurrió un error al eliminar el usuario';
        }
      });
  }

  cambiarEstado(usuario: Usuario): void {
    const nuevoEstado = !usuario.active;

    this.cargando = true;

    this.userService
      .actualizarEstado(
        usuario.id,
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
            const mensaje =
              response.message ||
              'No fue posible cambiar el estado';

            this.mensajeError = mensaje;

            this.mostrarError(
              'No se pudo cambiar el estado',
              mensaje
            );

            return;
          }

          usuario.active = nuevoEstado;
          this.filtrarUsuarios();
        },

        error: error => {
          const mensaje =
            this.obtenerMensajeError(
              error,
              'No fue posible cambiar el estado'
            );

          this.mensajeError = mensaje;

          this.mostrarError(
            'No se pudo cambiar el estado',
            mensaje
          );
        }
      });
  }

  mostrarError(
    titulo: string,
    detalle: string
  ): void {
    this.tituloError = titulo;
    this.detalleError = detalle;
    this.mostrarModalError = true;
    this.cdr.detectChanges();
  }

  cerrarModalError(): void {
    this.mostrarModalError = false;
    this.tituloError = '';
    this.detalleError = '';
    this.cdr.detectChanges();
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

    if (error?.status === 409) {
      return (
        error?.error?.message ||
        'Ya existe un usuario registrado con ese nombre de usuario o correo electrónico.'
      );
    }

    if (error?.status === 400) {
      return (
        error?.error?.message ||
        'Los datos enviados no son válidos. Revisa la información e inténtalo nuevamente.'
      );
    }

    if (error?.status === 401) {
      return (
        'Tu sesión no es válida o ha expirado. Inicia sesión nuevamente.'
      );
    }

    if (error?.status === 403) {
      return (
        'No tienes permisos para realizar esta acción.'
      );
    }

    if (error?.status === 404) {
      return (
        'El usuario que intentas modificar no fue encontrado.'
      );
    }

    if (error?.status >= 500) {
      return (
        'Ocurrió un error interno en el servidor. Inténtalo nuevamente.'
      );
    }

    return mensajePorDefecto;
  }

  private esEmailValido(email: string): boolean {
    const expresion =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return expresion.test(email.trim());
  }
}

