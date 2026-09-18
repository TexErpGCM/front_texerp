import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface Proveedor {
  id: number;
  taxId: string;
  name: string;
  active: boolean;
}

export interface CrearProveedorRequest {
  taxId: string;
  name: string;
  active: boolean;
}

@Component({
  selector: 'app-proveedores',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './proveedores.html',
  styleUrl: './proveedores.scss'
})
export class ProveedoresComponent implements OnInit {

  // ==========================================
  // DATOS LOCALES (MOCK)
  // ==========================================
  private baseProveedores: Proveedor[] = [
    { id: 1, taxId: '900123456-1', name: 'Textiles del Norte S.A.S.', active: true },
    { id: 2, taxId: '800987654-2', name: 'Hilados y Telas Colombia', active: true },
    { id: 3, taxId: '901234567-3', name: 'Insumos Industriales Ltda.', active: false },
    { id: 4, taxId: '811000111-4', name: 'Distribuidora Textil Global', active: true }
  ];

  proveedores: Proveedor[] = [];
  proveedorSeleccionado: Proveedor | null = null;

  // ==========================================
  // PAGINACIÓN
  // ==========================================
  paginaActual = 0;
  tamanioPagina = 5;
  totalElementos = 0;
  totalPaginas = 0;

  // ==========================================
  // FILTROS
  // ==========================================
  filtroTaxId = '';
  filtroNombre = '';
  filtroActivo: boolean | undefined = undefined;

  // ==========================================
  // ESTADOS DEL FORMULARIO Y ALERTAS
  // ==========================================
  mostrarFormulario = false;
  modoEdicion = false;
  guardando = false;
  cargando = false;
  errorFormulario = '';
  mensajeExito = '';

  // ==========================================
  // MODELO DE FORMULARIO
  // ==========================================
  formulario: CrearProveedorRequest = {
    taxId: '',
    name: '',
    active: true
  };

  ngOnInit(): void {
    this.cargarProveedores();
  }

  // ==========================================
  // CARGA Y CONSULTAS (MOCK LOCAL)
  // ==========================================
  cargarProveedores(): void {
    this.cargando = true;
    this.errorFormulario = '';

    let filtrados = [...this.baseProveedores];

    if (this.filtroTaxId.trim()) {
      filtrados = filtrados.filter(p =>
        p.taxId.toLowerCase().includes(this.filtroTaxId.toLowerCase().trim())
      );
    }

    if (this.filtroNombre.trim()) {
      filtrados = filtrados.filter(p =>
        p.name.toLowerCase().includes(this.filtroNombre.toLowerCase().trim())
      );
    }

    if (this.filtroActivo !== undefined && this.filtroActivo !== null && (this.filtroActivo as any) !== '') {
      const isActivo = String(this.filtroActivo) === 'true';
      filtrados = filtrados.filter(p => p.active === isActivo);
    }

    this.totalElementos = filtrados.length;
    this.totalPaginas = Math.ceil(this.totalElementos / this.tamanioPagina) || 1;

    const inicio = this.paginaActual * this.tamanioPagina;
    this.proveedores = filtrados.slice(inicio, inicio + this.tamanioPagina);
    this.cargando = false;
  }

  buscar(): void {
    this.paginaActual = 0;
    this.cargarProveedores();
  }

  limpiarFiltros(): void {
    this.filtroTaxId = '';
    this.filtroNombre = '';
    this.filtroActivo = undefined;
    this.paginaActual = 0;
    this.cargarProveedores();
  }

  cambiarPagina(pagina: number): void {
    if (pagina < 0 || pagina >= this.totalPaginas) {
      return;
    }
    this.paginaActual = pagina;
    this.cargarProveedores();
  }

  // ==========================================
  // ACCIONES DE CREACIÓN / EDICIÓN
  // ==========================================
  nuevoProveedor(): void {
    this.modoEdicion = false;
    this.proveedorSeleccionado = null;
    this.limpiarAlertas();

    this.formulario = {
      taxId: '',
      name: '',
      active: true
    };

    this.mostrarFormulario = true;
  }

  editar(proveedor: Proveedor): void {
    this.modoEdicion = true;
    this.proveedorSeleccionado = proveedor;
    this.limpiarAlertas();

    this.formulario = {
      taxId: proveedor.taxId,
      name: proveedor.name,
      active: proveedor.active
    };

    this.mostrarFormulario = true;
  }

  guardar(): void {
    this.limpiarAlertas();

    if (!this.validarFormulario()) {
      return;
    }

    const existeDuplicado = this.baseProveedores.some(
      p => p.taxId.trim() === this.formulario.taxId.trim() &&
           (!this.modoEdicion || (this.proveedorSeleccionado && p.id !== this.proveedorSeleccionado.id))
    );

    if (existeDuplicado) {
      this.errorFormulario = 'El documento o NIT ya pertenece a otro proveedor.';
      return;
    }

    if (this.modoEdicion && this.proveedorSeleccionado) {
      const idx = this.baseProveedores.findIndex(p => p.id === this.proveedorSeleccionado!.id);
      if (idx !== -1) {
        this.baseProveedores[idx] = {
          id: this.proveedorSeleccionado.id,
          ...this.formulario
        };
      }
      this.mensajeExito = 'Proveedor actualizado correctamente.';
    } else {
      const nuevo: Proveedor = {
        id: Date.now(),
        ...this.formulario
      };
      this.baseProveedores.unshift(nuevo);
      this.mensajeExito = 'Proveedor creado correctamente.';
    }

    this.mostrarFormulario = false;
    this.cargarProveedores();
  }

  cambiarEstado(proveedor: Proveedor): void {
    this.limpiarAlertas();
    proveedor.active = !proveedor.active;
    const target = this.baseProveedores.find(p => p.id === proveedor.id);
    if (target) {
      target.active = proveedor.active;
    }
    this.mensajeExito = `El proveedor ${proveedor.name} ahora está ${proveedor.active ? 'Activo' : 'Inactivo'}.`;
    this.cargarProveedores();
  }

  cancelar(): void {
    this.mostrarFormulario = false;
    this.errorFormulario = '';
  }

  // ==========================================
  // HELPERS Y VALIDACIONES
  // ==========================================
  validarFormulario(): boolean {
    if (!this.formulario.taxId.trim()) {
      this.errorFormulario = 'La identificación tributaria es obligatoria.';
      return false;
    }

    if (!this.formulario.name.trim()) {
      this.errorFormulario = 'El nombre del proveedor es obligatorio.';
      return false;
    }

    return true;
  }

  private limpiarAlertas(): void {
    this.errorFormulario = '';
    this.mensajeExito = '';
  }
}