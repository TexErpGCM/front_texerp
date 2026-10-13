import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { BalanceInventario, MovimientoInventario } from '../models/inventario.model';

@Injectable({
  providedIn: 'root'
})
export class InventarioService {

  private mockBalances: BalanceInventario[] = [
    { id: 1, sku: 'TEX-ALG-301', producto: 'Algodón Peinado 30/1 Blanco', categoria: 'Telas / Algodón', bodegaId: 1, bodegaNombre: 'Bodega Principal', cantidadDisponible: 1250, cantidadReservada: 300, stockMinimo: 500, fechaUltimoMovimiento: '2026-10-01' },
    { id: 2, sku: 'TEX-POL-202', producto: 'Poliéster Estampado Floral', categoria: 'Sintéticos', bodegaId: 2, bodegaNombre: 'Bodega Manizales', cantidadDisponible: 180, cantidadReservada: 150, stockMinimo: 200, fechaUltimoMovimiento: '2026-10-02' }
  ];

  private mockMovimientos: MovimientoInventario[] = [
    { id: 105, fechaHora: '2026-10-04 14:30:15', sku: 'TEX-ALG-301', producto: 'Algodón Peinado 30/1 Blanco', warehouse_id: 1, bodegaNombre: 'Bodega Principal', movement_type: 'ADJUSTMENT', quantity: 250, reserved_delta: 0, saldoAnterior: 1000, saldoNuevo: 1250, documentoOrigen: 'REC-2026-089', usuario: 'carlos.mendoza', observaciones: 'Ajuste de inventario' },
    { id: 104, fechaHora: '2026-10-04 11:15:00', sku: 'TEX-POL-202', producto: 'Poliéster Estampado Floral', warehouse_id: 2, bodegaNombre: 'Bodega Manizales', movement_type: 'SALE', quantity: -50, reserved_delta: 0, saldoAnterior: 230, saldoNuevo: 180, documentoOrigen: 'FAC-2026-0412', usuario: 'ana.gomez' }
  ];

  // Obtención de balances
  obtenerBalances(filtros: any): Observable<{ data: BalanceInventario[], totalRegistros: number }> {
    let resultados = [...this.mockBalances];
    if (filtros.sku?.trim()) {
      resultados = resultados.filter(i => i.sku.toLowerCase().includes(filtros.sku.toLowerCase().trim()));
    }
    return of({ data: resultados, totalRegistros: resultados.length });
  }

  // Método unificado para obtener movimientos dentro del mismo servicio
  obtenerMovimientos(filtros: any): Observable<{ data: MovimientoInventario[], totalRegistros: number }> {
    let resultados = [...this.mockMovimientos];
    if (filtros.sku?.trim()) {
      resultados = resultados.filter(m => m.sku.toLowerCase().includes(filtros.sku.toLowerCase().trim()));
    }
    if (filtros.tipo) {
      resultados = resultados.filter(m => m.movement_type === filtros.tipo);
    }
    return of({ data: resultados, totalRegistros: resultados.length });
  }
}