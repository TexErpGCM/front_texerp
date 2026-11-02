import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize, forkJoin } from 'rxjs';
import {
  PermissionInfo,
  RoleRequest,
  RoleResponse,
  RoleService
} from '../../core/services/role.service';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './roles.component.html',
  styleUrl: './roles.component.scss'
})
export class RolesComponent implements OnInit {
  private readonly service = inject(RoleService);
  private readonly cdr = inject(ChangeDetectorRef);

  roles: RoleResponse[] = [];
  permisos: PermissionInfo[] = [];
  permisosPorModulo: { module: string; permissions: PermissionInfo[] }[] = [];

  cargando = false;
  guardando = false;
  mensajeError = '';
  mensajeExito = '';

  mostrarFormulario = false;
  editando = false;
  rolId: number | null = null;

  formulario = {
    name: '',
    description: '',
    permissions: [] as string[]
  };

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    this.mensajeError = '';

    forkJoin({
      roles: this.service.listar(),
      permisos: this.service.permisos()
    })
      .pipe(finalize(() => {
        this.cargando = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: ({ roles, permisos }) => {
          this.roles = roles.data ?? [];
          this.permisos = permisos.data ?? [];
          this.agruparPermisos();
        },
        error: error => {
          this.mensajeError = error?.error?.message || 'No fue posible cargar roles y permisos.';
        }
      });
  }

  nuevoRol(): void {
    this.editando = false;
    this.rolId = null;
    this.formulario = { name: '', description: '', permissions: [] };
    this.mensajeError = '';
    this.mensajeExito = '';
    this.mostrarFormulario = true;
  }

  editarRol(rol: RoleResponse): void {
    this.editando = true;
    this.rolId = rol.id;
    this.formulario = {
      name: rol.name,
      description: rol.description ?? '',
      permissions: [...rol.permissions]
    };
    this.mensajeError = '';
    this.mensajeExito = '';
    this.mostrarFormulario = true;
  }

  cerrarFormulario(): void {
    if (this.guardando) return;
    this.mostrarFormulario = false;
  }

  togglePermiso(code: string, checked: boolean): void {
    const actual = new Set(this.formulario.permissions);
    checked ? actual.add(code) : actual.delete(code);
    this.formulario.permissions = [...actual];
  }

  tienePermiso(code: string): boolean {
    return this.formulario.permissions.includes(code);
  }

  seleccionarModulo(module: string, checked: boolean): void {
    const grupo = this.permisosPorModulo.find(item => item.module === module);
    if (!grupo) return;

    const actual = new Set(this.formulario.permissions);
    grupo.permissions.forEach(permission => {
      checked ? actual.add(permission.code) : actual.delete(permission.code);
    });
    this.formulario.permissions = [...actual];
  }

  moduloCompleto(module: string): boolean {
    const grupo = this.permisosPorModulo.find(item => item.module === module);
    return !!grupo?.permissions.length && grupo.permissions.every(p => this.tienePermiso(p.code));
  }

  guardar(): void {
    this.mensajeError = '';

    if (!this.formulario.name.trim()) {
      this.mensajeError = 'El nombre del rol es obligatorio.';
      return;
    }
    if (this.formulario.permissions.length === 0) {
      this.mensajeError = 'Selecciona al menos un permiso.';
      return;
    }

    const request: RoleRequest = {
      name: this.formulario.name.trim(),
      description: this.formulario.description.trim() || null,
      permissions: this.formulario.permissions
    };

    this.guardando = true;
    const peticion = this.editando && this.rolId !== null
      ? this.service.actualizar(this.rolId, request)
      : this.service.crear(request);

    peticion.pipe(finalize(() => {
      this.guardando = false;
      this.cdr.detectChanges();
    })).subscribe({
      next: response => {
        this.mostrarFormulario = false;
        this.mensajeExito = response.message || 'Rol guardado correctamente.';
        this.cargar();
      },
      error: error => {
        this.mensajeError = error?.error?.message || 'No fue posible guardar el rol.';
      }
    });
  }

  eliminar(rol: RoleResponse): void {
    if (!confirm(`¿Eliminar el rol ${rol.name}?`)) return;

    this.service.eliminar(rol.id).subscribe({
      next: response => {
        this.mensajeExito = response.message || 'Rol eliminado correctamente.';
        this.cargar();
      },
      error: error => {
        this.mensajeError = error?.error?.message || 'No fue posible eliminar el rol.';
      }
    });
  }

  private agruparPermisos(): void {
    const grupos = new Map<string, PermissionInfo[]>();
    this.permisos.forEach(permission => {
      const list = grupos.get(permission.module) ?? [];
      list.push(permission);
      grupos.set(permission.module, list);
    });

    this.permisosPorModulo = [...grupos.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([module, permissions]) => ({ module, permissions }));
  }
}
