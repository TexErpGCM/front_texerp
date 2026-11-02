import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { AnaliticaService, AnalyticsArea, AnalyticsFilters, AnalyticsResponse } from '../../core/services/analitica.service';

type Row = Record<string, unknown>;
type Kind = 'money' | 'percent' | 'count' | 'quantity' | 'date' | 'boolean' | 'text';
interface Metric { key: string; label: string; value: unknown; }
interface Bar { label: string; value: number; width: number; formatted: string; }

@Component({
  selector: 'app-analitica', standalone: true, imports: [CommonModule, FormsModule],
  templateUrl: './analitica.component.html', styleUrl: './analitica.component.scss'
})
export class AnaliticaComponent implements OnInit {
  private readonly service = inject(AnaliticaService);
  private readonly destroyRef = inject(DestroyRef);
  private requestVersion = 0;
  readonly tabs: { id: AnalyticsArea; title: string;}[] = [
    { id: 'sales', title: 'Ventas' },
    { id: 'inventory', title: 'Inventario' },
    { id: 'purchases', title: 'Compras' },
    { id: 'customers', title: 'Clientes'}
  ];
  area: AnalyticsArea = 'customers';
  filters: AnalyticsFilters = { from: this.dateOffset(-30), to: this.dateOffset(0), limit: 10, rankingBy: 'SALES' };
  readonly loading = signal(false);
  readonly error = signal('');
  readonly data = signal<AnalyticsResponse | null>(null);
  readonly metrics = computed<Metric[]>(() => {
    const summary = this.data()?.summary;
    return summary ? Object.entries(summary).map(([key, value]) => ({ key, value, label: this.label(key) })) : [];
  });
  readonly rows = computed<Row[]>(() => {
    const response = this.data();
    if (!response) return [];
    if (this.area === 'customers') return (response.customers ?? []) as Row[];
    if (this.area === 'purchases') return (response.suppliers ?? []) as Row[];
    const candidates = Object.entries(response).filter(([key, value]) => key !== 'summary' && Array.isArray(value));
    return (candidates.find(([, value]) => (value as unknown[]).length > 0)?.[1] as Row[] | undefined) ?? [];
  });
  readonly columns = computed(() => {
    const first = this.rows()[0];
    return first ? Object.keys(first).filter(key => first[key] === null || typeof first[key] !== 'object') : [];
  });
  readonly bars = computed<Bar[]>(() => {
    const rows = this.rows();
    const choices: Record<AnalyticsArea, { name: string[]; value: string[] }> = {
      sales: { name: ['name', 'productName'], value: ['sales'] },
      inventory: { name: ['warehouseName', 'warehouseCode'], value: ['inventoryValue', 'availableQuantity'] },
      purchases: { name: ['supplierName'], value: ['purchasedAmount'] },
      customers: { name: ['name'], value: ['sales'] }
    };
    const cfg = choices[this.area];
    const valueKey = cfg.value.find(k => rows.some(r => typeof r[k] === 'number'));
    if (!valueKey) return [];
    const selected = rows.map(row => ({
      label: String(cfg.name.map(k => row[k]).find(v => v !== null && v !== undefined && v !== '') ?? 'Sin nombre'),
      value: Number(row[valueKey] ?? 0)
    })).filter(x => Number.isFinite(x.value) && x.value >= 0).sort((a, b) => b.value - a.value).slice(0, 8);
    const max = Math.max(...selected.map(x => x.value), 0);
    return selected.map(x => ({ ...x, width: max > 0 ? x.value / max * 100 : 0, formatted: this.format(x.value, valueKey) }));
  });
  readonly chartTitle = computed(() => ({
    sales: 'Ventas por producto', inventory: 'Inventario por bodega',
    purchases: 'Compras por proveedor', customers: 'Ventas por cliente'
  })[this.area]);

  ngOnInit(): void { this.load(); }
  choose(area: AnalyticsArea): void {
    if (this.area === area) return;
    this.area = area;
    this.filters.rankingBy = area === 'purchases' ? 'AMOUNT' : area === 'customers' ? 'SALES' : undefined;
    this.filters.type = undefined; this.filters.segment = undefined;
    this.filters.supplierId = null; this.filters.productId = null; this.filters.warehouseId = null;
    this.load();
  }
  load(): void {
    const version = ++this.requestVersion;
    if (!this.filters.from || !this.filters.to || this.filters.from > this.filters.to ||
        !Number.isInteger(this.filters.limit) || this.filters.limit < 1 || this.filters.limit > 100) {
      this.loading.set(false); this.data.set(null);
      this.error.set('Revisa el rango de fechas y el límite (1 a 100).'); return;
    }
    this.loading.set(true); this.error.set(''); this.data.set(null);
    this.service.dashboard(this.area, { ...this.filters }).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => { if (version === this.requestVersion) this.loading.set(false); })
    ).subscribe({
      next: response => { if (version === this.requestVersion) this.data.set(response); },
      error: (err: HttpErrorResponse) => {
        if (version !== this.requestVersion) return;
        this.error.set(err.status === 404 ? 'El endpoint no está disponible.' :
          err.status === 403 ? 'No tienes permisos para consultar estos datos.' :
          err.status === 401 ? 'Tu sesión ha expirado.' :
          `No fue posible consultar los datos (${err.status || 'sin conexión'}).`);
      }
    });
  }
  get title(): string { return this.tabs.find(t => t.id === this.area)?.title ?? ''; }
  private readonly names: Record<string, string> = {
    totalSales: 'Ventas totales', unitsSold: 'Unidades vendidas', salesCount: 'Número de ventas',
    averageTicket: 'Ticket promedio', totalCost: 'Costo total', profit: 'Utilidad',
    marginPercentage: 'Margen (%)', valuationComplete: 'Valoración completa', missingCostCount: 'Registros sin costo',
    availableQuantity: 'Cantidad disponible', reservedQuantity: 'Cantidad reservada',
    availableInventoryValue: 'Valor del inventario disponible', skuWarehouseCount: 'SKU por bodega',
    belowMinimumCount: 'Productos bajo mínimo', belowMinimumUnits: 'Unidades faltantes',
    movementEntries: 'Entradas', movementExits: 'Salidas', netAdjustments: 'Ajustes netos', netMovement: 'Movimiento neto',
    purchasedAmount: 'Monto comprado', orderedQuantity: 'Cantidad solicitada',
    receivedQuantity: 'Cantidad recibida', pendingQuantity: 'Cantidad pendiente',
    fulfillmentPercentage: 'Cumplimiento (%)', averageDeliveryDays: 'Días promedio de entrega',
    purchaseOrderCount: 'Órdenes de compra', supplierCount: 'Proveedores',
    purchasingCustomers: 'Clientes compradores', transactions: 'Transacciones',
    repeatCustomers: 'Clientes recurrentes', repeatCustomerPercentage: 'Recurrencia (%)',
    customerId: 'ID cliente', supplierId: 'ID proveedor', warehouseId: 'ID bodega',
    warehouseCode: 'Código bodega', warehouseName: 'Bodega', supplierName: 'Proveedor',
    name: 'Nombre', sales: 'Ventas', cost: 'Costo', marginPercentageValue: 'Margen (%)',
    units: 'Unidades', inventoryValue: 'Valor inventario', averageUnitCost: 'Costo unitario promedio',
    purchaseCount: 'Compras', distinctPurchaseDays: 'Días con compras',
    type: 'Tipo', segment: 'Clasificación', active: 'Activo', recurring: 'Recurrente',
    lastPurchaseAt: 'Última compra', averageUnitPrice: 'Precio unitario promedio',
    id: 'ID', valuationCompleteFlag: 'Valoración completa'
  };
  label(key: string): string {
    return this.names[key] ?? key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g, ' ');
  }
  private kind(key: string): Kind {
    if (/At$|Date$|Timestamp$/.test(key)) return 'date';
    if (/Percentage$|^marginPercentage$/.test(key)) return 'percent';
    if (/^(totalSales|averageTicket|totalCost|profit|sales|cost|purchasedAmount|inventoryValue|availableInventoryValue|averageUnitCost|averageUnitPrice)$/.test(key)) return 'money';
    if (/^(valuationComplete|active|recurring)$/.test(key)) return 'boolean';
    if (/^(unitsSold|availableQuantity|reservedQuantity|belowMinimumUnits|movementEntries|movementExits|netAdjustments|netMovement|orderedQuantity|receivedQuantity|pendingQuantity|units)$/.test(key)) return 'quantity';
    if (/^(salesCount|missingCostCount|skuWarehouseCount|belowMinimumCount|purchaseOrderCount|supplierCount|purchasingCustomers|transactions|repeatCustomers|customerId|supplierId|warehouseId|id|purchaseCount|distinctPurchaseDays)$/.test(key)) return 'count';
    return 'text';
  }
  format(value: unknown, key = ''): string {
    if (value === null || value === undefined || value === '') return 'Sin datos';
    if (typeof value === 'boolean') return value ? 'Sí' : 'No';
    if (this.kind(key) === 'date') {
      const date = new Date(String(value));
      return Number.isNaN(date.getTime()) ? String(value) : new Intl.DateTimeFormat('es-CO', {
        timeZone: 'America/Bogota', dateStyle: 'medium', timeStyle: 'short'
      }).format(date);
    }
    if (typeof value !== 'number') return String(value);
    if (this.kind(key) === 'money') return new Intl.NumberFormat('es-CO', {
      style: 'currency', currency: 'COP', maximumFractionDigits: 0
    }).format(value);
    return new Intl.NumberFormat('es-CO', { maximumFractionDigits: this.kind(key) === 'percent' ? 2 : 2 }).format(value);
  }
  trackColumn(_index: number, column: string): string { return column; }
  private dateOffset(days: number): string {
    const d = new Date(); d.setDate(d.getDate() + days);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
}
