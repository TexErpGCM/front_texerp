import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

export type TipoCliente = 'NATURAL' | 'JURIDICO';

export interface Cliente {
  id?: number;
  taxId: string;
  name: string;
  type: TipoCliente;
  active: boolean;
}

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './clientes.component.html',
  styleUrl: './clientes.component.scss'
})
export class ClientesComponent implements OnInit {
  private fb = inject(FormBuilder);

  clientes: Cliente[] = [
    { id: 1, taxId: '1012345678', name: 'Carlos Mendoza', type: 'NATURAL', active: true },
    { id: 2, taxId: '900852369-1', name: 'Distribuidora Global S.A.S.', type: 'JURIDICO', active: true },
    { id: 3, taxId: '1098765432', name: 'Ana Gómez', type: 'NATURAL', active: false }
  ];

  clientesFiltrados: Cliente[] = [];
  cargando = false;
  guardando = false;
  mostrarFormulario = false;
  modoEdicion = false;
  clienteEditandoId: number | null = null;

  mensajeExito = '';
  errorFormulario = '';

  filtroForm!: FormGroup;
  clienteForm!: FormGroup;

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
      taxId: [''],
      name: [''],
      type: [''],
      active: [null]
    });

    this.clienteForm = this.fb.group({
      taxId: ['', [Validators.required, Validators.maxLength(50)]],
      name: ['', [Validators.required, Validators.maxLength(150)]],
      type: ['NATURAL' as TipoCliente, [Validators.required]],
      active: [true]
    });
  }

  aplicarFiltros(): void {
    const { taxId, name, type, active } = this.filtroForm.value;
    let resultado = [...this.clientes];

    if (taxId) {
      resultado = resultado.filter(c => c.taxId.toLowerCase().includes(taxId.toLowerCase().trim()));
    }
    if (name) {
      resultado = resultado.filter(c => c.name.toLowerCase().includes(name.toLowerCase().trim()));
    }
    if (type) {
      resultado = resultado.filter(c => c.type === type);
    }
    if (active !== null && active !== '' && active !== undefined) {
      const isActivo = active === 'true' || active === true;
      resultado = resultado.filter(c => c.active === isActivo);
    }

    this.totalElementos = resultado.length;
    this.totalPaginas = Math.ceil(this.totalElementos / this.tamanoPagina);
    this.paginaActual = 0;

    const inicio = this.paginaActual * this.tamanoPagina;
    this.clientesFiltrados = resultado.slice(inicio, inicio + this.tamanoPagina);
  }

  limpiarFiltros(): void {
    this.filtroForm.reset({ taxId: '', name: '', type: '', active: null });
    this.aplicarFiltros();
  }

  nuevoCliente(): void {
    this.modoEdicion = false;
    this.clienteEditandoId = null;
    this.errorFormulario = '';
    this.clienteForm.reset({ taxId: '', name: '', type: 'NATURAL', active: true });
    this.mostrarFormulario = true;
  }

  editarCliente(cliente: Cliente): void {
    this.modoEdicion = true;
    this.clienteEditandoId = cliente.id ?? null;
    this.errorFormulario = '';
    this.clienteForm.patchValue({
      taxId: cliente.taxId,
      name: cliente.name,
      type: cliente.type,
      active: cliente.active
    });
    this.mostrarFormulario = true;
  }

  guardar(): void {
    if (this.clienteForm.invalid) {
      this.clienteForm.markAllAsTouched();
      return;
    }

    const formVal = this.clienteForm.value;
    const existeDuplicado = this.clientes.some(
      c => c.taxId.trim() === formVal.taxId.trim() && c.id !== this.clienteEditandoId
    );

    if (existeDuplicado) {
      this.errorFormulario = 'El documento ya pertenece a otro cliente.';
      return;
    }

    if (this.modoEdicion && this.clienteEditandoId) {
      const index = this.clientes.findIndex(c => c.id === this.clienteEditandoId);
      if (index !== -1) {
        this.clientes[index] = { id: this.clienteEditandoId, ...formVal };
      }
      this.mensajeExito = 'Cliente actualizado con éxito.';
    } else {
      const nuevo: Cliente = { id: Date.now(), ...formVal };
      this.clientes.unshift(nuevo);
      this.mensajeExito = 'Cliente registrado correctamente.';
    }

    this.mostrarFormulario = false;
    this.aplicarFiltros();
  }

  cambiarEstado(cliente: Cliente): void {
    if (!cliente.id) return;
    cliente.active = !cliente.active;
    this.mensajeExito = `El cliente ${cliente.name} ahora está ${cliente.active ? 'Activo' : 'Inactivo'}.`;
    this.aplicarFiltros();
  }

  cambiarPagina(pagina: number): void {
    if (pagina >= 0 && pagina < this.totalPaginas) {
      this.paginaActual = pagina;
      const inicio = this.paginaActual * this.tamanoPagina;
      this.clientesFiltrados = this.clientes.slice(inicio, inicio + this.tamanoPagina);
    }
  }

  cancelar(): void {
    this.mostrarFormulario = false;
    this.errorFormulario = '';
  }
}