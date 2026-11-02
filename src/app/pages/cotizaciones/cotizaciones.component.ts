import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize, forkJoin } from 'rxjs';
import { Cliente, ClienteService } from '../../core/services/cliente.service';
import { Variante, VarianteproductoService } from '../../core/services/variante.producto.service';
import { Bodega, BodegaService } from '../../core/services/bodega.service';
import { ComercialService } from '../../core/services/comercial.service';
import { Cotizacion, CrearCotizacionRequest } from '../../core/models/comercial.model';
import { APP_PERMISSIONS, PermissionService } from '../../core/services/permission.service';

@Component({
  selector: 'app-cotizaciones',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './cotizaciones.component.html',
  styleUrl: './cotizaciones.component.scss'
})
export class CotizacionesComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly comercialService = inject(ComercialService);
  private readonly clienteService = inject(ClienteService);
  private readonly varianteService = inject(VarianteproductoService);
  private readonly bodegaService = inject(BodegaService);
  private readonly permissions = inject(PermissionService);
  private readonly cdr = inject(ChangeDetectorRef);

  cotizaciones: Cotizacion[] = [];
  clientes: Cliente[] = [];
  variantes: Variante[] = [];
  bodegas: Bodega[] = [];

  form!: FormGroup;
  cargando = false;
  guardando = false;
  mensajeError = '';
  mensajeExito = '';
  mostrarFormulario = false;
  mostrarConversion = false;
  cotizacionConversion: Cotizacion | null = null;
  bodegaConversion: number | null = null;

  paginaActual = 0;
  totalPaginas = 0;
  totalElementos = 0;
  tamanioPagina = 20;

  readonly canCreate = this.permissions.has(APP_PERMISSIONS.QUOTE_CREATE);
  readonly canConvert = this.permissions.has(APP_PERMISSIONS.QUOTE_CONVERT);
  readonly canCancel = this.permissions.has(APP_PERMISSIONS.QUOTE_CANCEL);

  ngOnInit(): void {
    this.crearFormulario();
    this.cargarCatalogos();
    this.cargarCotizaciones();
  }

  get lineas(): FormArray {
    return this.form.get('lines') as FormArray;
  }

  crearFormulario(): void {
    const hoy = this.toDateInput(new Date());
    const vencimiento = new Date();
    vencimiento.setDate(vencimiento.getDate() + 7);

    this.form = this.fb.group({
      customerId: [null, Validators.required],
      issueDate: [hoy, Validators.required],
      expirationDate: [this.toDateInput(vencimiento), Validators.required],
      notes: [''],
      lines: this.fb.array([])
    });
    this.agregarLinea();
  }

  cargarCatalogos(): void {
    forkJoin({
      clientes: this.clienteService.listar({ active: true }, 0, 200),
      variantes: this.varianteService.obtenerVariantes({ active: true, page: 0, size: 300 }),
      bodegas: this.bodegaService.listar({ active: true }, 0, 100)
    }).subscribe({
      next: ({ clientes, variantes, bodegas }) => {
        this.clientes = clientes.data?.content ?? [];
        this.variantes = variantes.data?.content ?? [];
        this.bodegas = bodegas.data?.content ?? [];
      },
      error: error => this.mensajeError = this.obtenerMensajeError(error, 'No fue posible cargar los catálogos.')
    });
  }

  cargarCotizaciones(): void {
    this.cargando = true;
    this.mensajeError = '';
    this.comercialService.listarCotizaciones(this.paginaActual, this.tamanioPagina)
      .pipe(finalize(() => { this.cargando = false; this.cdr.detectChanges(); }))
      .subscribe({
        next: response => {
          this.cotizaciones = response.data?.content ?? [];
          this.paginaActual = response.data?.page ?? 0;
          this.totalPaginas = response.data?.totalPages ?? 0;
          this.totalElementos = response.data?.totalElements ?? 0;
        },
        error: error => {
          this.cotizaciones = [];
          this.mensajeError = this.obtenerMensajeError(error, 'No fue posible cargar las cotizaciones.');
        }
      });
  }

  agregarLinea(): void {
    this.lineas.push(this.fb.group({
      variantId: [null, Validators.required],
      quantity: [1, [Validators.required, Validators.min(0.000001)]],
      unitPrice: [0, [Validators.required, Validators.min(0)]]
    }));
  }

  eliminarLinea(index: number): void {
    if (this.lineas.length === 1) return;
    this.lineas.removeAt(index);
  }

  seleccionarVariante(index: number): void {
    const group = this.lineas.at(index) as FormGroup;
    const variante = this.variantes.find(v => v.id === Number(group.get('variantId')?.value));
    if (variante) group.patchValue({ unitPrice: variante.salePrice });
  }

  subtotalLinea(index: number): number {
    const linea = this.lineas.at(index).value;
    return this.redondear(Number(linea.quantity || 0) * Number(linea.unitPrice || 0));
  }

  totalCotizacion(): number {
    return this.redondear(this.lineas.controls.reduce((total, _, i) => total + this.subtotalLinea(i), 0));
  }

  guardar(): void {
    this.mensajeError = '';
    this.mensajeExito = '';
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      this.mensajeError = 'Completa cliente, fechas y todas las líneas con cantidades positivas.';
      return;
    }

    const value = this.form.getRawValue();
    if (new Date(value.expirationDate) < new Date(value.issueDate)) {
      this.mensajeError = 'La fecha de vencimiento no puede ser anterior a la fecha de emisión.';
      return;
    }

    const cliente = this.clientes.find(c => c.id === Number(value.customerId));
    if (!cliente?.active) {
      this.mensajeError = 'El cliente seleccionado no se encuentra activo.';
      return;
    }

    const request: CrearCotizacionRequest = {
      customerId: Number(value.customerId),
      issueDate: value.issueDate,
      expirationDate: value.expirationDate,
      notes: value.notes?.trim() || null,
      lines: value.lines.map((linea: any) => ({
        variantId: Number(linea.variantId),
        quantity: Number(linea.quantity),
        unitPrice: Number(linea.unitPrice)
      }))
    };

    this.guardando = true;
    this.comercialService.crearCotizacion(request)
      .pipe(finalize(() => { this.guardando = false; this.cdr.detectChanges(); }))
      .subscribe({
        next: response => {
          this.mensajeExito = `Cotización ${response.data?.number ?? ''} creada correctamente.`;
          this.mostrarFormulario = false;
          this.crearFormulario();
          this.paginaActual = 0;
          this.cargarCotizaciones();
        },
        error: error => this.mensajeError = this.obtenerMensajeError(error, 'No fue posible crear la cotización.')
      });
  }

  abrirConversion(cotizacion: Cotizacion): void {
    this.cotizacionConversion = cotizacion;
    this.bodegaConversion = this.bodegas[0]?.id ?? null;
    this.mostrarConversion = true;
  }

  convertir(): void {
    if (!this.cotizacionConversion || !this.bodegaConversion) {
      this.mensajeError = 'Selecciona una bodega para confirmar la venta.';
      return;
    }

    this.guardando = true;
    this.mensajeError = '';
    this.comercialService.convertirCotizacion(this.cotizacionConversion.id, this.bodegaConversion)
      .pipe(finalize(() => { this.guardando = false; this.cdr.detectChanges(); }))
      .subscribe({
        next: response => {
          this.mensajeExito = `Cotización convertida en la venta ${response.data?.number ?? ''}.`;
          this.mostrarConversion = false;
          this.cotizacionConversion = null;
          this.cargarCotizaciones();
        },
        error: error => this.mensajeError = this.obtenerMensajeError(error, 'No fue posible convertir la cotización.')
      });
  }

  cancelar(cotizacion: Cotizacion): void {
    if (!confirm(`¿Cancelar la cotización ${cotizacion.number}?`)) return;
    this.comercialService.cancelarCotizacion(cotizacion.id).subscribe({
      next: () => {
        this.mensajeExito = `Cotización ${cotizacion.number} cancelada.`;
        this.cargarCotizaciones();
      },
      error: error => this.mensajeError = this.obtenerMensajeError(error, 'No fue posible cancelar la cotización.')
    });
  }

  puedeConvertirse(c: Cotizacion): boolean {
    return !['CONVERTED', 'CANCELLED', 'EXPIRED'].includes(String(c.status).toUpperCase());
  }

  puedeCancelarse(c: Cotizacion): boolean {
    return !['CONVERTED', 'CANCELLED'].includes(String(c.status).toUpperCase());
  }

  cambiarPagina(page: number): void {
    if (page < 0 || page >= this.totalPaginas || page === this.paginaActual) return;
    this.paginaActual = page;
    this.cargarCotizaciones();
  }

  estadoTexto(status: string): string {
    const estados: Record<string, string> = {
      DRAFT: 'Borrador', SENT: 'Enviada', CONVERTED: 'Convertida', CANCELLED: 'Cancelada', EXPIRED: 'Vencida'
    };
    return estados[String(status).toUpperCase()] ?? status;
  }

  private redondear(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  private toDateInput(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  private obtenerMensajeError(error: any, fallback: string): string {
    const disponible = error?.error?.data?.available;
    const base = error?.error?.message || error?.error?.errors?.[0] || fallback;
    return disponible !== undefined ? `${base} Disponible: ${disponible}.` : base;
  }
}
