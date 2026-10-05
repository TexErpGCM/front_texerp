import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { BalanceInventario, FiltrosInventario, RespuestaPaginadaInventario } from '../models/inventario.model';

@Injectable({
  providedIn: 'root'
})
export class InventarioService {

  private mockBalances: BalanceInventario[] = [
    { id: 1, sku: 'TEX-ALG-301', producto: 'Algodón Peinado 30/1 Blanco', categoria: 'Telas / Algodón', bodegaId: 1, bodegaNombre: 'Bodega Principal', cantidadDisponible: 1250, cantidadReservada: 300, stockMinimo: 500, fechaUltimoMovimiento: '2026-10-01' },
    { id: 2, sku: 'TEX-POL-202', producto: 'Poliéster Estampado Floral', categoria: 'Sintéticos', bodegaId: 2, bodegaNombre: 'Bodega Manizales', cantidadDisponible: 180, cantidadReservada: 150, stockMinimo: 200, fechaUltimoMovimiento: '2026-10-02' },
    { id: 3, sku: 'INS-HIL-500', producto: 'Hilo Poliéster Cono 5000m', categoria: 'Insumos / Hilos', bodegaId: 3, bodegaNombre: 'Bodega Medellín', cantidadDisponible: 3400, cantidadReservada: 800, stockMinimo: 1000, fechaUltimoMovimiento: '2026-10-03' },
    { id: 4, sku: 'ACA-TIN-004', producto: 'Tinte Reactivo Azul Marino', categoria: 'Acabados / Tintes', bodegaId: 4, bodegaNombre: 'Bodega Cali', cantidadDisponible: 0, cantidadReservada: 0, stockMinimo: 50, fechaUltimoMovimiento: '2026-09-28' },
    { id: 5, sku: 'TEX-DRI-105', producto: 'Dril Algodón Licrado', categoria: 'Telas / Algodón', bodegaId: 1, bodegaNombre: 'Bodega Principal', cantidadDisponible: 250, cantidadReservada: 50, stockMinimo: 300, fechaUltimoMovimiento: '2026-10-04' },
    { id: 6, sku: 'TEX-ALG-301', producto: 'Algodón Peinado 30/1 Blanco', categoria: 'Telas / Algodón', bodegaId: 3, bodegaNombre: 'Bodega Medellín', cantidadDisponible: 0, cantidadReservada: 0, stockMinimo: 200, fechaUltimoMovimiento: '2026-09-15' }
  ];

  obtenerBalances(filtros: FiltrosInventario): Observable<RespuestaPaginadaInventario> {
    let resultados = this.mockBalances.map(item => ({
      ...item,
      estado: this.calcularEstado(item.cantidadDisponible, item.stockMinimo)
    }));

    // CA-1 / CA-2: Filtro por SKU
    if (filtros.sku?.trim()) {
      const skuTerm = filtros.sku.toLowerCase().trim();
      resultados = resultados.filter(i => i.sku.toLowerCase().includes(skuTerm));
    }

    // CA-2: Filtro por Producto
    if (filtros.producto?.trim()) {
      const prodTerm = filtros.producto.toLowerCase().trim();
      resultados = resultados.filter(i => i.producto.toLowerCase().includes(prodTerm));
    }

    // CA-2: Filtro por Bodega
    if (filtros.bodegaId) {
      resultados = resultados.filter(i => i.bodegaId === Number(filtros.bodegaId));
    }

    // CA-2: Filtro por Estado
    if (filtros.estado) {
      resultados = resultados.filter(i => i.estado === filtros.estado);
    }

    // Paginación
    const totalRegistros = resultados.length;
    const totalPaginas = Math.ceil(totalRegistros / filtros.pageSize) || 1;
    const inicio = (filtros.page - 1) * filtros.pageSize;
    const dataPaginada = resultados.slice(inicio, inicio + filtros.pageSize);

    return of({
      data: dataPaginada,
      totalRegistros,
      totalPaginas,
      paginaActual: filtros.page
    });
  }

  // CA-3 / CA-5: Determinación de estado y alerta de stock mínimo
  private calcularEstado(disponible: number, minimo: number): 'Disponible' | 'Bajo Stock' | 'Agotado' {
    if (disponible === 0) return 'Agotado';
    if (disponible <= minimo) return 'Bajo Stock';
    return 'Disponible';
  }
}