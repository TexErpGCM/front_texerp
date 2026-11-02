import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize, forkJoin } from 'rxjs';
import { Bodega, BodegaService } from '../../core/services/bodega.service';
import { ComercialService } from '../../core/services/comercial.service';
import { Proveedor, ProveedorService } from '../../core/services/proveedor.service';
import { Variante, VarianteproductoService } from '../../core/services/variante.producto.service';
import { CrearOrdenCompraRequest, OrdenCompra, FiltrosOrdenCompra, RecepcionCompra, RegistrarRecepcionCompraRequest } from '../../core/models/comercial.model';
import { APP_PERMISSIONS, PermissionService } from '../../core/services/permission.service';

@Component({
  selector: 'app-ordenes-compra',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './ordenes-compra.component.html',
  styleUrl: './ordenes-compra.component.scss'
})
export class OrdenesCompraComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(ComercialService);
  private readonly bodegasService = inject(BodegaService);
  private readonly proveedoresService = inject(ProveedorService);
  private readonly variantesService = inject(VarianteproductoService);
  private readonly permissions = inject(PermissionService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly canCreate = this.permissions.has(APP_PERMISSIONS.PURCHASE_ORDER_CREATE);
  readonly canReceive = this.permissions.has(APP_PERMISSIONS.PURCHASE_ORDER_RECEIVE);
  readonly canApprove = this.permissions.has(APP_PERMISSIONS.PURCHASE_ORDER_APPROVE);
  ordenes: OrdenCompra[] = [];
  bodegas: Bodega[] = [];
  recepciones: RecepcionCompra[] = [];
  recepcionSeleccionada: RecepcionCompra | null = null;
  filtros: FiltrosOrdenCompra = {};
  recepcionForm!: FormGroup;
  mostrarRecepcion = false;
  proveedores: Proveedor[] = [];
  variantes: Variante[] = [];
  form!: FormGroup;
  rechazoForm!: FormGroup;
  seleccionada: OrdenCompra | null = null;
  mostrarFormulario = false;
  mostrarDetalle = false;
  mostrarRechazo = false;
  cargando = false;
  guardando = false;
  cargandoDetalle = false;
  mensajeError = '';
  mensajeExito = '';
  paginaActual = 0;
  totalPaginas = 0;
  totalElementos = 0;
  tamanioPagina = 20;

  ngOnInit(): void {
    this.crearFormulario();
    this.crearFormularioRecepcion();
    this.rechazoForm = this.fb.group({ reason: ['', [Validators.required, Validators.minLength(3)]] });
    this.cargarCatalogos();
    this.cargarOrdenes();
  }

  get lineasRecepcion(): FormArray { return this.recepcionForm.get('lines') as FormArray; }
  pendiente(linea: { quantity: number; receivedQuantity?: number }): number {
    return Math.max(0, Number(linea.quantity) - Number(linea.receivedQuantity ?? 0));
  }
  estadoRecepcion(): string {
    if (!this.seleccionada) return '';
    if (!['APPROVED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'COMPLETED'].includes(this.seleccionada.status.toUpperCase())) return this.estadoTexto(this.seleccionada.status);
    if (this.seleccionada.lines.every(l => this.pendiente(l) === 0)) return 'Recepción completa';
    if (this.seleccionada.lines.some(l => Number(l.receivedQuantity ?? 0) > 0)) return 'Parcialmente recibida';
    return this.estadoTexto(this.seleccionada.status);
  }
  crearFormularioRecepcion(): void {
    this.recepcionForm = this.fb.group({ warehouseId: [null, Validators.required], document: ['', Validators.required], lines: this.fb.array([]) });
  }
  prepararRecepcion(): void {
    if (!this.seleccionada || !this.canReceive || !['APPROVED', 'PARTIALLY_RECEIVED'].includes(this.seleccionada.status.toUpperCase())) return;
    this.crearFormularioRecepcion();
    this.seleccionada.lines.filter(l => this.pendiente(l) > 0).forEach(l => this.lineasRecepcion.push(this.fb.group({
      orderLineId: [l.id, Validators.required], sku: [l.sku || '#' + l.variantId], pending: [this.pendiente(l)],
      quantity: [0, [Validators.required, Validators.min(0)]]
    })));
    this.mostrarRecepcion = true;
  }
  confirmarRecepcion(): void {
    if (!this.seleccionada || !this.canReceive || this.guardando) return;
    this.recepcionForm.markAllAsTouched();
    const form = this.recepcionForm.getRawValue();
    const cantidades = form.lines.filter((l: any) => Number(l.quantity) > 0);
    if (this.recepcionForm.invalid || !cantidades.length || form.lines.some((l: any) => Number(l.quantity) > Number(l.pending))) {
      this.mensajeError = 'Selecciona una bodega activa, informa el documento y registra cantidades positivas sin superar el pendiente de cada línea.';
      return;
    }
    const request: RegistrarRecepcionCompraRequest = {
      warehouseId: Number(form.warehouseId), document: form.document.trim(),
      lines: cantidades.map((l: any) => ({ orderLineId: Number(l.orderLineId), quantity: Number(l.quantity) }))
    };
    this.guardando = true;
    this.mensajeError = '';
    this.service.registrarRecepcionCompra(this.seleccionada.id, request).pipe(finalize(() => { this.guardando = false; this.cdr.detectChanges(); })).subscribe({
      next: response => {
        this.mensajeExito = `Recepción ${response.data?.number ?? ''} registrada correctamente.`;
        this.mostrarRecepcion = false;
        this.service.obtenerOrdenCompra(this.seleccionada!.id).subscribe({
          next: detalle => { if (detalle.data) this.seleccionada = detalle.data; this.cargarRecepciones(this.seleccionada!.id); this.cargarOrdenes(); },
          error: error => this.mensajeError = this.obtenerMensajeError(error, 'No fue posible actualizar la orden.')
        });
      },
      error: error => this.mensajeError = this.obtenerMensajeError(error, error.status === 409 ? 'La orden ya no permite recepciones.' : 'No fue posible registrar la recepción.')
    });
  }
  cargarRecepciones(id: number): void {
    this.recepciones = [];
    this.service.listarRecepcionesCompra(id).subscribe({
      next: response => { this.recepciones = response.data ?? []; this.cdr.detectChanges(); },
      error: error => { this.mensajeError = this.obtenerMensajeError(error, 'No fue posible consultar las recepciones.'); this.cdr.detectChanges(); }
    });
  }
  verRecepcion(id: number): void {
    this.service.obtenerRecepcionCompra(id).subscribe({
      next: response => { this.recepcionSeleccionada = response.data; this.cdr.detectChanges(); },
      error: error => { this.mensajeError = this.obtenerMensajeError(error, 'No fue posible consultar el comprobante.'); this.cdr.detectChanges(); }
    });
  }
  aplicarFiltros(): void { this.paginaActual = 0; this.cargarOrdenes(); }
  limpiarFiltros(): void { this.filtros = {}; this.aplicarFiltros(); }

  get lineas(): FormArray { return this.form.get('lines') as FormArray; }

  crearFormulario(): void {
    this.form = this.fb.group({
      supplierId: [null, Validators.required],
      orderDate: [new Date().toISOString().slice(0, 10), Validators.required],
      lines: this.fb.array([])
    });
    this.agregarLinea();
  }

  agregarLinea(): void {
    this.lineas.push(this.fb.group({
      variantId: [null, Validators.required],
      quantity: [1, [Validators.required, Validators.min(0.000001)]],
      unitCost: [null, [Validators.required, Validators.min(0.01)]]
    }));
  }

  eliminarLinea(index: number): void {
    if (this.lineas.length > 1) this.lineas.removeAt(index);
  }

  seleccionarVariante(index: number): void {
    const linea = this.lineas.at(index) as FormGroup;
    const variante = this.variantes.find(v => v.id === Number(linea.get('variantId')?.value));
    if (variante) linea.patchValue({ unitCost: variante.cost });
  }

  total(): number {
    return this.lineas.controls.reduce((total, linea) =>
      total + Number(linea.value.quantity || 0) * Number(linea.value.unitCost || 0), 0);
  }

  cargarCatalogos(): void {
    forkJoin({
      bodegas: this.bodegasService.listar({ active: true }, 0, 200),
      proveedores: this.proveedoresService.listar({ active: true }, 0, 200),
      variantes: this.variantesService.obtenerVariantes({ active: true, page: 0, size: 300 })
    }).subscribe({
      next: ({ bodegas, proveedores, variantes }) => {
        this.bodegas = bodegas.data?.content ?? [];
        this.proveedores = proveedores.data?.content ?? [];
        this.variantes = variantes.data?.content ?? [];
        this.cdr.detectChanges();
      },
      error: error => { this.mensajeError = this.obtenerMensajeError(error, 'No fue posible cargar los catálogos.'); this.cdr.detectChanges(); }
    });
  }

  cargarOrdenes(): void {
    this.cargando = true;
    this.service.listarOrdenesCompra(this.paginaActual, this.tamanioPagina, this.filtros)
      .pipe(finalize(() => { this.cargando = false; this.cdr.detectChanges(); }))
      .subscribe({
        next: response => {
          this.ordenes = response.data?.content ?? [];
          this.paginaActual = response.data?.page ?? 0;
          this.totalPaginas = response.data?.totalPages ?? 0;
          this.totalElementos = response.data?.totalElements ?? 0;
        },
        error: error => this.mensajeError = this.obtenerMensajeError(error, 'No fue posible cargar las órdenes.')
      });
  }

  crearOrden(): void {
    if (!this.canCreate || this.guardando) return;
    this.form.markAllAsTouched();
    if (this.form.invalid || !this.lineas.length) {
      this.mensajeError = 'Completa el proveedor, fecha y todas las líneas con cantidades y costos positivos.';
      return;
    }
    const value = this.form.getRawValue();
    const request: CrearOrdenCompraRequest = {
      supplierId: Number(value.supplierId),
      orderDate: value.orderDate,
      lines: value.lines.map((l: any) => ({ variantId: Number(l.variantId), quantity: Number(l.quantity), unitCost: Number(l.unitCost) }))
    };
    this.guardando = true;
    this.mensajeError = '';
    this.service.crearOrdenCompra(request)
      .pipe(finalize(() => { this.guardando = false; this.cdr.detectChanges(); }))
      .subscribe({
        next: response => {
          this.mensajeExito = `Orden ${response.data?.number ?? ''} creada y pendiente de aprobación.`;
          this.mostrarFormulario = false;
          this.crearFormulario();
          this.paginaActual = 0;
          this.cargarOrdenes();
        },
        error: error => this.mensajeError = this.obtenerMensajeError(error, 'No fue posible crear la orden.')
      });
  }

  verDetalle(orden: OrdenCompra): void {
    this.seleccionada = orden;
    this.mostrarDetalle = true;
    this.mostrarRechazo = false;
    this.mostrarRecepcion = false;
    this.recepcionSeleccionada = null;
    this.cargarRecepciones(orden.id);
    this.cargandoDetalle = true;
    this.service.obtenerOrdenCompra(orden.id)
      .pipe(finalize(() => { this.cargandoDetalle = false; this.cdr.detectChanges(); }))
      .subscribe({
        next: response => { if (response.data) this.seleccionada = response.data; },
        error: error => this.mensajeError = this.obtenerMensajeError(error, 'No fue posible cargar el detalle.')
      });
  }

  puedeDecidir(): boolean {
    return this.canApprove && this.seleccionada?.status.toUpperCase() === 'PENDING_APPROVAL';
  }

  aprobar(): void {
    if (!this.puedeDecidir() || this.guardando) return;
    this.guardarDecision(this.service.aprobarOrdenCompra(this.seleccionada!.id), 'Orden aprobada correctamente.');
  }

  rechazar(): void {
    if (!this.puedeDecidir() || this.guardando) return;
    this.rechazoForm.markAllAsTouched();
    if (this.rechazoForm.invalid) {
      this.mensajeError = 'Debes informar el motivo del rechazo (mínimo 3 caracteres).';
      return;
    }
    this.guardarDecision(this.service.rechazarOrdenCompra(this.seleccionada!.id, {
      reason: this.rechazoForm.value.reason.trim()
    }), 'Orden rechazada correctamente.');
  }

  private guardarDecision(operacion: import('rxjs').Observable<any>, mensaje: string): void {
    this.guardando = true;
    this.mensajeError = '';
    operacion.pipe(finalize(() => { this.guardando = false; this.cdr.detectChanges(); })).subscribe({
      next: () => {
        this.mensajeExito = mensaje;
        this.mostrarRechazo = false;
        this.service.obtenerOrdenCompra(this.seleccionada!.id).subscribe({
          next: response => { if (response.data) this.seleccionada = response.data; this.cargarOrdenes(); },
          error: error => this.mensajeError = this.obtenerMensajeError(error, 'No fue posible actualizar el detalle.')
        });
      },
      error: error => this.mensajeError = this.obtenerMensajeError(error,
        error.status === 409 ? 'La orden ya fue decidida o no está pendiente.' :
        error.status === 403 ? 'No tienes permiso para decidir esta orden.' : 'No fue posible guardar la decisión.')
    });
  }

  cambiarPagina(page: number): void {
    if (page < 0 || page >= this.totalPaginas || page === this.paginaActual) return;
    this.paginaActual = page;
    this.cargarOrdenes();
  }

  estadoTexto(status: string): string {
    const estados: Record<string, string> = {
      PENDING_APPROVAL: 'Pendiente de aprobación', APPROVED: 'Aprobada', REJECTED: 'Rechazada', PARTIALLY_RECEIVED: 'Parcialmente recibida', RECEIVED: 'Recibida', COMPLETED: 'Completada'
    };
    return estados[status?.toUpperCase()] ?? status;
  }

  private obtenerMensajeError(error: any, fallback: string): string {
    const detalle = error?.error?.errors?.[0];
    return error?.error?.message || (typeof detalle === 'string' ? detalle : detalle?.message) || fallback;
  }
}
