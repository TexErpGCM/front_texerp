
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize, forkJoin, Observable } from 'rxjs';
import { Cliente, ClienteService } from '../../core/services/cliente.service';
import { Variante, VarianteproductoService } from '../../core/services/variante.producto.service';
import { Bodega, BodegaService } from '../../core/services/bodega.service';
import { ComercialService } from '../../core/services/comercial.service';
import { CrearVentaRequest, RegistrarPagoRequest, Venta } from '../../core/models/comercial.model';
import { APP_PERMISSIONS, PermissionService } from '../../core/services/permission.service';

@Component({
  selector: 'app-ventas',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './ventas.component.html',
  styleUrl: './ventas.component.scss'
})
export class VentasComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly comercialService = inject(ComercialService);
  private readonly clienteService = inject(ClienteService);
  private readonly varianteService = inject(VarianteproductoService);
  private readonly bodegaService = inject(BodegaService);
  private readonly permissions = inject(PermissionService);
  private readonly cdr = inject(ChangeDetectorRef);

  ventas: Venta[] = [];
  clientes: Cliente[] = [];
  variantes: Variante[] = [];
  bodegas: Bodega[] = [];

  form!: FormGroup;
  pagoForm!: FormGroup;
  despachoForm!: FormGroup;
  cancelacionForm!: FormGroup;

  mostrarDespacho = false;
  mostrarCancelacion = false;
  ventaSeleccionada: Venta | null = null;
  mostrarFormulario = false;
  mostrarDetalle = false;
  mostrarPago = false;
  cargando = false;
  guardando = false;
  cargandoDetalle = false;
  mensajeError = '';
  mensajeExito = '';

  paginaActual = 0;
  totalPaginas = 0;
  totalElementos = 0;
  tamanioPagina = 20;

  readonly canCreate = this.permissions.has(APP_PERMISSIONS.SALE_CREATE);
  readonly canDispatch = this.permissions.has(APP_PERMISSIONS.SALE_DISPATCH);
  readonly canDeliver = this.permissions.has(APP_PERMISSIONS.SALE_DELIVER);
  readonly canCancel = this.permissions.has(APP_PERMISSIONS.SALE_CANCEL);
  readonly canPay = this.permissions.has(APP_PERMISSIONS.PAYMENT_CREATE);

  ngOnInit(): void {
    this.crearFormulario();
    this.crearPagoForm();

    this.despachoForm = this.fb.group({
      evidence: ['']
    });

    this.cancelacionForm = this.fb.group({
      reason: ['', [Validators.required, Validators.minLength(3)]]
    });

    this.cargarCatalogos();
    this.cargarVentas();
  }

  get lineas(): FormArray {
    return this.form.get('lines') as FormArray;
  }

  crearFormulario(): void {
    this.form = this.fb.group({
      customerId: [null, Validators.required],
      warehouseId: [null, Validators.required],
      notes: [''],
      lines: this.fb.array([])
    });

    this.agregarLinea();
  }

  crearPagoForm(): void {
    this.pagoForm = this.fb.group({
      method: ['CASH', Validators.required],
      amount: [null, [Validators.required, Validators.min(0.01)]],
      paymentDate: [this.fechaLocalHoy(), Validators.required],
      reference: ['']
    });
  }

  cargarCatalogos(): void {
    forkJoin({
      clientes: this.clienteService.listar({ active: true }, 0, 200),
      variantes: this.varianteService.obtenerVariantes({
        active: true,
        page: 0,
        size: 300
      }),
      bodegas: this.bodegaService.listar({ active: true }, 0, 100)
    }).subscribe({
      next: ({ clientes, variantes, bodegas }) => {
        this.clientes = clientes.data?.content ?? [];
        this.variantes = variantes.data?.content ?? [];
        this.bodegas = bodegas.data?.content ?? [];
      },
      error: error => {
        this.mensajeError = this.obtenerMensajeError(
          error,
          'No fue posible cargar los catálogos.'
        );
      }
    });
  }

  cargarVentas(): void {
    this.cargando = true;
    this.mensajeError = '';

    this.comercialService.listarVentas(
      this.paginaActual,
      this.tamanioPagina
    )
      .pipe(finalize(() => {
        this.cargando = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: response => {
          this.ventas = response.data?.content ?? [];
          this.paginaActual = response.data?.page ?? 0;
          this.totalPaginas = response.data?.totalPages ?? 0;
          this.totalElementos = response.data?.totalElements ?? 0;
        },
        error: error => {
          this.ventas = [];
          this.mensajeError = this.obtenerMensajeError(
            error,
            'No fue posible cargar las ventas.'
          );
        }
      });
  }

  agregarLinea(): void {
    this.lineas.push(this.fb.group({
      variantId: [null, Validators.required],
      quantity: [1, [Validators.required, Validators.min(0.000001)]],
      unitPrice: [0, [Validators.required, Validators.min(0)]],
      discount: [0, [Validators.required, Validators.min(0)]],
      taxPercent: [0, [Validators.required, Validators.min(0)]]
    }));
  }

  eliminarLinea(index: number): void {
    if (this.lineas.length === 1) return;
    this.lineas.removeAt(index);
  }

  seleccionarVariante(index: number): void {
    const group = this.lineas.at(index) as FormGroup;

    const variante = this.variantes.find(
      v => v.id === Number(group.get('variantId')?.value)
    );

    if (variante) {
      group.patchValue({ unitPrice: variante.salePrice });
    }
  }

  calculoLinea(index: number): {
    subtotal: number;
    descuento: number;
    impuesto: number;
    total: number;
  } {
    const value = this.lineas.at(index).value;

    const bruto = Number(value.quantity || 0) * Number(value.unitPrice || 0);
    const descuento = Math.min(Number(value.discount || 0), bruto);
    const subtotal = bruto - descuento;
    const impuesto = subtotal * (Number(value.taxPercent || 0) / 100);

    return {
      subtotal: this.redondear(bruto),
      descuento: this.redondear(descuento),
      impuesto: this.redondear(impuesto),
      total: this.redondear(subtotal + impuesto)
    };
  }

  resumen(): {
    subtotal: number;
    descuento: number;
    impuesto: number;
    total: number;
  } {
    return this.lineas.controls.reduce((acc, _, i) => {
      const linea = this.calculoLinea(i);

      acc.subtotal += linea.subtotal;
      acc.descuento += linea.descuento;
      acc.impuesto += linea.impuesto;
      acc.total += linea.total;

      return acc;
    }, {
      subtotal: 0,
      descuento: 0,
      impuesto: 0,
      total: 0
    });
  }

  confirmarVenta(): void {
    if (!this.canCreate || this.guardando) return;

    this.mensajeError = '';
    this.mensajeExito = '';

    this.form.markAllAsTouched();

    if (this.form.invalid) {
      this.mensajeError =
        'Completa cliente, bodega y todas las líneas con cantidades válidas.';
      return;
    }

    const value = this.form.getRawValue();

    const request: CrearVentaRequest = {
      customerId: Number(value.customerId),
      warehouseId: Number(value.warehouseId),
      notes: value.notes?.trim() || null,
      lines: value.lines.map((line: any) => ({
        variantId: Number(line.variantId),
        quantity: Number(line.quantity),
        unitPrice: Number(line.unitPrice),
        discountAmount: Number(line.discount || 0),
        taxRate: Number(line.taxPercent || 0)
      }))
    };

    this.guardando = true;

    this.comercialService.crearYConfirmarVenta(request)
      .pipe(finalize(() => {
        this.guardando = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: response => {
          this.mensajeExito =
            `Venta ${response.data?.number ?? ''} confirmada correctamente.`;

          this.mostrarFormulario = false;
          this.crearFormulario();
          this.paginaActual = 0;
          this.cargarVentas();
        },
        error: error => {
          this.mensajeError = this.obtenerMensajeError(
            error,
            'No fue posible confirmar la venta.'
          );
        }
      });
  }

  verDetalle(venta: Venta): void {
    this.ventaSeleccionada = venta;
    this.mostrarDespacho = false;
    this.mostrarCancelacion = false;
    this.mostrarDetalle = true;
    this.cargandoDetalle = true;

    this.comercialService.obtenerVenta(venta.id)
      .pipe(finalize(() => {
        this.cargandoDetalle = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: response => {
          if (response.data) {
            this.ventaSeleccionada = response.data;
          }
        },
        error: error => {
          this.mensajeError = this.obtenerMensajeError(
            error,
            'No fue posible actualizar el detalle de la venta.'
          );
        }
      });
  }

  abrirPago(): void {
    const venta = this.ventaSeleccionada;

    if (
      !venta ||
      !this.puedeRegistrarPago() ||
      this.guardando ||
      this.cargandoDetalle
    ) return;

    this.mensajeError = '';
    this.crearPagoForm();

    this.pagoForm.patchValue({
      amount: venta.pendingBalance
    });

    this.mostrarPago = true;
  }

  puedeRegistrarPago(): boolean {
    return !!this.ventaSeleccionada &&
      this.canPay &&
      ['CONFIRMED', 'PARTIALLY_PAID'].includes(
        this.ventaSeleccionada.status.toUpperCase()
      ) &&
      Number(this.ventaSeleccionada.pendingBalance) > 0;
  }

  registrarPago(): void {
    if (
      !this.puedeRegistrarPago() ||
      this.guardando ||
      !this.ventaSeleccionada
    ) return;

    this.mensajeError = '';
    this.mensajeExito = '';
    this.pagoForm.markAllAsTouched();

    if (this.pagoForm.invalid) {
      this.mensajeError =
        'El pago debe tener método, fecha y un monto positivo.';
      return;
    }

    const value = this.pagoForm.getRawValue();

    if (
      Number(value.amount) >
      Number(this.ventaSeleccionada.pendingBalance)
    ) {
      this.mensajeError =
        `El pago no puede superar el saldo pendiente de ${this.ventaSeleccionada.pendingBalance}.`;
      return;
    }

    const amount = Number(value.amount);

    if (
      !Number.isFinite(amount) ||
      amount <= 0 ||
      Math.abs(amount * 100 - Math.round(amount * 100)) > 1e-7
    ) {
      this.mensajeError =
        'Ingresa un monto positivo con máximo dos decimales.';
      return;
    }

    const request: RegistrarPagoRequest = {
      method: value.method,
      amount,
      paidAt: new Date(`${value.paymentDate}T12:00:00`).toISOString(),
      reference: value.reference?.trim() || null
    };

    this.guardando = true;
    const saleId = this.ventaSeleccionada.id;

    this.comercialService.registrarPago(saleId, request)
      .pipe(finalize(() => {
        this.guardando = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: response => {
          if (response.data) {
            this.ventaSeleccionada = response.data;
          }

          this.mensajeExito = 'Pago registrado correctamente.';
          this.mostrarPago = false;
          this.cargarVentas();
        },
        error: error => {
          this.mensajeError = this.obtenerMensajeError(
            error,
            'No fue posible registrar o actualizar el pago.'
          );
        }
      });
  }

  // VALIDACIONES DE PERMISOS Y ESTADOS

  puedeDespachar(): boolean {
    return this.canDispatch &&
      this.ventaSeleccionada?.status?.toUpperCase() === 'PAID';
  }

  puedeEntregar(): boolean {
    return this.canDeliver &&
      this.ventaSeleccionada?.status?.toUpperCase() === 'DISPATCHED';
  }

  puedeCancelar(): boolean {
    return this.canCancel &&
      !!this.ventaSeleccionada &&
      !['CANCELLED', 'COMPLETED'].includes(
        this.ventaSeleccionada.status.toUpperCase()
      );
  }

  despacharVenta(): void {
    if (
      !this.ventaSeleccionada ||
      !this.puedeDespachar() ||
      this.guardando
    ) return;

    this.ejecutarAccionVenta(
      this.comercialService.despacharVenta(
        this.ventaSeleccionada.id,
        {
          evidence: this.despachoForm.value.evidence?.trim() || null
        }
      ),
      'Venta despachada correctamente.',
      'No fue posible despachar la venta.'
    );
  }

  completarEntrega(): void {
    if (
      !this.ventaSeleccionada ||
      !this.puedeEntregar() ||
      this.guardando
    ) return;

    this.ejecutarAccionVenta(
      this.comercialService.completarEntrega(
        this.ventaSeleccionada.id
      ),
      'Entrega confirmada correctamente.',
      'No fue posible completar la entrega.'
    );
  }

  cancelarVenta(): void {
    if (
      !this.ventaSeleccionada ||
      !this.puedeCancelar() ||
      this.guardando
    ) return;

    this.cancelacionForm.markAllAsTouched();

    if (this.cancelacionForm.invalid) {
      this.mensajeError =
        'Debes informar el motivo de cancelación (mínimo 3 caracteres).';
      return;
    }

    this.ejecutarAccionVenta(
      this.comercialService.cancelarVenta(
        this.ventaSeleccionada.id,
        {
          reason: this.cancelacionForm.value.reason.trim()
        }
      ),
      'Venta cancelada correctamente.',
      'No fue posible cancelar la venta.'
    );
  }

  private ejecutarAccionVenta(
    operacion: Observable<any>,
    exito: string,
    fallback: string
  ): void {
    this.guardando = true;
    this.mensajeError = '';
    this.mensajeExito = '';

    operacion
      .pipe(finalize(() => {
        this.guardando = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: () => {
          this.mensajeExito = exito;
          this.mostrarDespacho = false;
          this.mostrarCancelacion = false;

          this.comercialService.obtenerVenta(
            this.ventaSeleccionada!.id
          ).subscribe({
            next: response => {
              if (response.data) {
                this.ventaSeleccionada = response.data;
              }

              this.cargarVentas();
            },
            error: error => {
              this.mensajeError = this.obtenerMensajeError(
                error,
                'No fue posible refrescar la venta.'
              );
            }
          });
        },
        error: error => {
          this.mensajeError = this.obtenerMensajeError(
            error,
            error.status === 409
              ? 'La venta cambió de estado o la transición no está permitida.'
              : error.status === 403
                ? 'No tienes permiso para realizar esta operación.'
                : fallback
          );
        }
      });
  }

  cambiarPagina(page: number): void {
    if (
      page < 0 ||
      page >= this.totalPaginas ||
      page === this.paginaActual
    ) return;

    this.paginaActual = page;
    this.cargarVentas();
  }

  estadoTexto(status: string): string {
    const estados: Record<string, string> = {
      PENDING: 'Pendiente',
      CONFIRMED: 'Confirmada',
      PARTIALLY_PAID: 'Parcialmente pagada',
      PAID: 'Pagada',
      DISPATCHED: 'Despachada',
      COMPLETED: 'Completada',
      CANCELLED: 'Cancelada'
    };

    return estados[String(status).toUpperCase()] ?? status;
  }

  private fechaLocalHoy(): string {
    const now = new Date();
    const local = new Date(
      now.getTime() - now.getTimezoneOffset() * 60000
    );

    return local.toISOString().slice(0, 10);
  }

  private redondear(value: number): number {
    return Math.round(
      (value + Number.EPSILON) * 100
    ) / 100;
  }

  private obtenerMensajeError(
    error: any,
    fallback: string
  ): string {
    const data = error?.error?.data;
    const disponible = data?.available ?? data?.availableStock;

    const base =
      error?.error?.message ||
      error?.error?.errors?.[0] ||
      fallback;

    return disponible !== undefined
      ? `${base} Disponible: ${disponible}.`
      : base;
  }
}
