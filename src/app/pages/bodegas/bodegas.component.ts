import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface Bodega {
  id: number;
  codigo: string;
  nombre: string;
  direccion: string;
  telefono: string;
  estado: 'Active' | 'Inactive';
}

@Component({
  selector: 'app-bodegas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bodegas.component.html',
  styleUrls: ['./bodegas.component.scss']
})
export class BodegasComponent implements OnInit {

  filtros = {
    codigo: '',
    nombre: '',
    estado: ''
  };

  listaBodegas: Bodega[] = [
    { id: 1, codigo: 'BOD-01', nombre: 'Bodega Principal', direccion: 'Calle 10 # 20-30', telefono: '6015550101', estado: 'Active' },
    { id: 2, codigo: 'BOD-02', nombre: 'Bodega Manizales', direccion: 'Carrera 23 # 45-12', telefono: '6068880202', estado: 'Active' },
    { id: 3, codigo: 'BOD-03', nombre: 'Bodega Medellín', direccion: 'Av. El Poblado # 10-15', telefono: '6044440303', estado: 'Active' },
    { id: 4, codigo: 'BOD-04', nombre: 'Bodega Cali', direccion: 'Calle 5 # 38-100', telefono: '6023330404', estado: 'Inactive' }
  ];

  listaBodegasFiltrada: Bodega[] = [];

  ngOnInit(): void {
    this.aplicarFiltros();
  }

  aplicarFiltros(): void {
    this.listaBodegasFiltrada = this.listaBodegas.filter(item => {
      const cumpleCodigo = !this.filtros.codigo.trim() || item.codigo.toLowerCase().includes(this.filtros.codigo.toLowerCase().trim());
      const cumpleNombre = !this.filtros.nombre.trim() || item.nombre.toLowerCase().includes(this.filtros.nombre.toLowerCase().trim());
      const cumpleEstado = !this.filtros.estado || item.estado === this.filtros.estado;
      return cumpleCodigo && cumpleNombre && cumpleEstado;
    });
  }

  limpiarFiltros(): void {
    this.filtros = {
      codigo: '',
      nombre: '',
      estado: ''
    };
    this.aplicarFiltros();
  }

  abrirModalCrear(): void {
    // Lógica para abrir modal de creación
  }

  editarBodega(bodega: Bodega): void {
    // Lógica para abrir modal de edición
  }
}