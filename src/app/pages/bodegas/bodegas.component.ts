import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

export interface Bodega {
  id: number;
  code: string;
  name: string;
  location: string;
  active: boolean;
  hasMovements: boolean;
}

@Component({
  selector: 'app-bodegas',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './bodegas.component.html',
  styleUrl: './bodegas.component.scss'
})
export class BodegasComponent implements OnInit {
  private fb = inject(FormBuilder);

  baseBodegas: Bodega[] = [
    { id: 1, code: 'BOD-01', name: 'Bodega Principal Central', location: 'Planta Principal - Zona Norte', active: true, hasMovements: true },
    { id: 2, code: 'BOD-02', name: 'Almacén Mitería y Telas', location: 'Edificio B - Nivel 2', active: true, hasMovements: false },
    { id: 3, code: 'BOD-03', name: 'Depósito Producto Terminado', location: 'Zona Franca - Bodega 12', active: false, hasMovements: true }
  ];

  bodegasFiltradas: Bodega[] = [];
  cargando = false;
  mostrarFormulario = false;
  modoEdicion = false;
  bodegaEditandoId: number | null = null;

  mensajeExito = '';
  errorFormulario = '';

  filtroForm!: FormGroup;
  bodegaForm!: FormGroup;

  paginaActual = 0;
  tamanoPagina = 5;
  totalPaginas = 0;
  totalElementos = 0;

  ngOnInit(): void {
    this.inicializarFormularios();
    this.aplicarFiltros();
  }

  private inicializarFormularios(): void {
    this.filtroForm = this.fb.group({
      code: [''],
      name: [''],
      active: [null]
    });

    this.bodegaForm = this.fb.group({
      code: ['', [Validators.required, Validators.maxLength(20)]],
      name: ['', [Validators.required, Validators.maxLength(100)]],
      location: ['', [Validators.required, Validators.maxLength(150)]],
      active: [true]
    });
  }

  aplicarFiltros(): void {
    const { code, name, active } = this.filtroForm.value;
    let resultado = [...this.baseBodegas];

    if (code) {
      resultado = resultado.filter(b => b.code.toLowerCase().includes(code.toLowerCase().trim()));
    }
    if (name) {
      resultado = resultado.filter(b => b.name.toLowerCase().includes(name.toLowerCase().trim()));
    }
    if (active !== null && active !== '' && active !== undefined) {
      const isActivo = active === 'true' || active === true;
      resultado = resultado.filter(b => b.active === isActivo);
    }

    this.totalElementos = resultado.length;
    this.totalPaginas = Math.ceil(this.totalElementos / this.tamanoPagina) || 1;
    this.paginaActual = 0;

    const inicio = this.paginaActual * this.tamanoPagina;
    this.bodegasFiltradas = resultado.slice(inicio, inicio + this.tamanoPagina);
  }

  limpiarFiltros(): void {
    this.filtroForm.reset({ code: '', name: '', active: null });
    this.aplicarFiltros();
  }

  nuevaBodega(): void {
    this.modoEdicion = false;
    this.bodegaEditandoId = null;
    this.errorFormulario = '';
    this.bodegaForm.reset({ code: '', name: '', location: '', active: true });
    this.bodegaForm.get('code')?.enable();
    this.mostrarFormulario = true;
  }

  editarBodega(bodega: Bodega): void {
    this.modoEdicion = true;
    this.bodegaEditandoId = bodega.id;
    this.errorFormulario = '';
    this.bodegaForm.patchValue({
      code: bodega.code,
      name: bodega.name,
      location: bodega.location,
      active: bodega.active
    });
    this.bodegaForm.get('code')?.disable();
    this.mostrarFormulario = true;
  }

  guardar(): void {
    if (this.bodegaForm.invalid) {
      this.bodegaForm.markAllAsTouched();
      return;
    }

    const rawValues = this.bodegaForm.getRawValue();

    const existeCodigo = this.baseBodegas.some(
      b => b.code.trim().toUpperCase() === rawValues.code.trim().toUpperCase() && b.id !== this.bodegaEditandoId
    );

    if (existeCodigo) {
      this.errorFormulario = 'HTTP 409 - El código de bodega ya se encuentra registrado.';
      return;
    }

    if (this.modoEdicion && this.bodegaEditandoId) {
      const index = this.baseBodegas.findIndex(b => b.id === this.bodegaEditandoId);
      if (index !== -1) {
        this.baseBodegas[index] = {
          ...this.baseBodegas[index],
          name: rawValues.name,
          location: rawValues.location,
          active: rawValues.active
        };
      }
      this.mensajeExito = 'Bodega actualizada correctamente.';
    } else {
      const nueva: Bodega = {
        id: Date.now(),
        code: rawValues.code.trim().toUpperCase(),
        name: rawValues.name,
        location: rawValues.location,
        active: rawValues.active,
        hasMovements: false
      };
      this.baseBodegas.unshift(nueva);
      this.mensajeExito = 'HTTP 201 - Bodega registrada con éxito.';
    }

    this.mostrarFormulario = false;
    this.aplicarFiltros();
  }

  cambiarEstado(bodega: Bodega): void {
    bodega.active = !bodega.active;
    const target = this.baseBodegas.find(b => b.id === bodega.id);
    if (target) {
      target.active = bodega.active;
    }

    if (!bodega.active && bodega.hasMovements) {
      this.mensajeExito = `Bodega ${bodega.code} inactivada. Se conserva su trazabilidad e historial de movimientos (CA-3).`;
    } else {
      this.mensajeExito = `Estado de la bodega ${bodega.code} cambiado a ${bodega.active ? 'Activo' : 'Inactivo'}.`;
    }
    this.aplicarFiltros();
  }

  cambiarPagina(pagina: number): void {
    if (pagina >= 0 && pagina < this.totalPaginas) {
      this.paginaActual = pagina;
      const inicio = this.paginaActual * this.tamanoPagina;
      this.bodegasFiltradas = this.baseBodegas.slice(inicio, inicio + this.tamanoPagina);
    }
  }

  cancelar(): void {
    this.mostrarFormulario = false;
    this.errorFormulario = '';
  }
}