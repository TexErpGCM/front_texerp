import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { MovimientoInventario, FiltrosMovimientos, RespuestaPaginadaMovimientos } from '../models/movimiento-inventario.model';

@Injectable({
  providedIn: 'root'
})
export class MovimientoInventarioService {

  // Mock con coherencia estricta de saldos (CA-3) e inmutabilidad (CA-4)
  private mockMovimientos: MovimientoInventario[] = [
    {
      id: 105,
      fechaHora: '2026-10-04 14:30:15',
      sku: 'TEX-ALG-301',
      producto: 'Algodón Peinado 30/1 Blanco',
      bodegaId: 1,
      bodegaNombre: 'Bodega Principal',
      tipo: 'ENTRADA',
      cantidad: 250,
      saldoAnterior: 1000,
      saldoNuevo: 1250,
      documentoOrigen: 'REC-2026-089',
      usuario: 'carlos.mendoza',
      observaciones: 'Recepción de proveedor Telares del Valle Ltda.',
      esInmutable: true
    },
    {
      id: 104,
      fechaHora: '2026-10-04 11:15:00',
      sku: 'TEX-POL-202',
      producto: 'Poliéster Estampado Floral',
      bodegaId: 2,
      bodegaNombre: 'Bodega Manizales',
      tipo: 'SALIDA',
      cantidad: 50,
      saldoAnterior: 230,
      saldoNuevo: 180,
      documentoOrigen: 'FAC-2026-0412',
      usuario: 'ana.gomez',
      observaciones: 'Despacho Venta Pedido #412',
      esInmutable: true
    },
    {
      id: 103,
      fechaHora: '2026-10-03 16:45:22',
      sku: 'ACA-TIN-004',
      producto: 'Tinte Reactivo Azul Marino',
      bodegaId: 4,
      bodegaNombre: 'Bodega Cali',
      tipo: 'AJUSTE_NEGATIVO',
      cantidad: 50,
      saldoAnterior: 50,
      saldoNuevo: 0,
      documentoOrigen: 'AJU-2026-012',
      usuario: 'auditor.rodriguez',
      observaciones: 'Ajuste por merma/evaporación en depósito',
      esInmutable: true
    },
    {
      id: 102,
      fechaHora: '2026-10-03 09:20:10',
      sku: 'INS-HIL-500',
      producto: 'Hilo Poliéster Cono 5000m',
      bodegaId: 3,
      bodegaNombre: 'Bodega Medellín',
      tipo: 'ENTRADA',
      cantidad: 400,
      saldoAnterior: 3000,
      saldoNuevo: 3400,
      documentoOrigen: 'REC-2026-080',
      usuario: 'carlos.mendoza',
      observaciones: 'Ingreso por producción interna',
      esInmutable: true
    },
    {
      id: 101,
      fechaHora: '2026-10-02 15:10:05',
      sku: 'TEX-DRI-105',
      producto: 'Dril Algodón Licrado',
      bodegaId: 1,
      bodegaNombre: 'Bodega Principal',
      tipo: 'TRANSFERENCIA',
      cantidad: 100,
      saldoAnterior: 350,
      saldoNuevo: 250,
      documentoOrigen: 'TRF-2026-005',
      usuario: 'luis.perez',
      observaciones: 'Transferencia hacia Bodega Manizales',
      esInmutable: true
    }
  ];

  obtenerMovimientos(filtros: FiltrosMovimientos): Observable<RespuestaPaginadaMovimientos> {
    let resultados = [...this.mockMovimientos];

    // CA-2: Filtro por SKU
    if (filtros.sku?.trim()) {
      const skuTerm = filtros.sku.toLowerCase().trim();
      resultados = resultados.filter(m => m.sku.toLowerCase().includes(skuTerm));
    }

    // CA-2: Filtro por Bodega
    if (filtros.bodegaId) {
      resultados = resultados.filter(m => m.bodegaId === Number(filtros.bodegaId));
    }

    // CA-2: Filtro por Tipo de Movimiento
    if (filtros.tipo) {
      resultados = resultados.filter(m => m.tipo === filtros.tipo);
    }

    // CA-2: Filtro por Documento Origen
    if (filtros.documentoOrigen?.trim()) {
      const docTerm = filtros.documentoOrigen.toLowerCase().trim();
      resultados = resultados.filter(m => m.documentoOrigen.toLowerCase().includes(docTerm));
    }

    // Ordenamiento cronológico descendente (más recientes primero)
    resultados.sort((a, b) => new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime());

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
}