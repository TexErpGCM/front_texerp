import {
  ChangeDetectorRef,
  Component,
  OnInit
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { LoadingComponent } from '../../layout/loading/loading.component';

import {
  InventarioService,
  InventoryBalance,
  InventoryAdjustmentRequest
} from '../../core/services/inventario.service';

import {
  Bodega,
  BodegaService
} from '../../core/services/bodega.service';

@Component({
  selector: 'app-listar-inventario',
  standalone: true,

  imports: [
    CommonModule,
    FormsModule,
    LoadingComponent
  ],

  templateUrl: './inventario.component.html',
  styleUrl: './inventario.component.scss'
})
export class ListarInventarioComponent implements OnInit {

  inventario: InventoryBalance[] = [];

  cargando = false;

  mensajeExito = '';
  mensajeError = '';

  sku = '';
  producto = '';
  bodega = '';

  mostrarSoloBajo = false;

  paginaActual = 0;
  pageSize = 20;

  totalElementos = 0;
  totalPaginas = 0;

  mostrarFormulario = false;

  ajusteVariante: number | null = null;
  ajusteBodega: number | null = null;
  ajusteCantidad: number | null = null;

  ajusteMotivo = '';
  ajusteDocumento = '';

  guardando = false;

  bodegas: Bodega[] = [];
  cargandoBodegas = false;

  constructor(
    private inventarioService: InventarioService,
    private bodegaService: BodegaService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarInventario();
    this.cargarBodegas();
  }

  cargarBodegas(): void {

    this.cargandoBodegas = true;

    this.bodegaService
      .listar(
        {
          active: true
        },
        0,
        100
      )
      .pipe(
        finalize(() => {
          this.cargandoBodegas = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({

        next: (response) => {
          this.bodegas = response.data?.content ?? [];
        },

        error: () => {
          this.bodegas = [];
          this.mensajeError =
            'No fue posible cargar las bodegas.';
        }

      });
  }

  cargarInventario(): void {

    this.cargando = true;
    this.mensajeError = '';

    if (this.mostrarSoloBajo) {
      this.cargarInventarioBajo();
      return;
    }

    this.inventarioService
      .obtenerInventario(
        this.sku,
        this.producto,
        this.bodega,
        '',
        false,
        this.paginaActual,
        this.pageSize
      )
      .pipe(
        finalize(() => {
          this.cargando = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({

        next: (response) => {
          this.procesarRespuesta(response.data);
        },

        error: () => {

          this.inventario = [];
          this.totalElementos = 0;
          this.totalPaginas = 0;

          this.mensajeError =
            'No fue posible consultar el inventario.';
        }

      });
  }

  private cargarInventarioBajo(): void {

    this.inventarioService
      .obtenerInventarioBajo(
        this.producto,
        this.bodega,
        this.paginaActual,
        this.pageSize
      )
      .pipe(
        finalize(() => {
          this.cargando = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({

        next: (response) => {
          this.procesarRespuesta(response.data);
        },

        error: () => {

          this.inventario = [];
          this.totalElementos = 0;
          this.totalPaginas = 0;

          this.mensajeError =
            'No fue posible consultar el inventario bajo.';
        }

      });
  }

  private procesarRespuesta(data: any): void {

    this.inventario = data?.content ?? [];
    this.totalElementos = data?.totalElements ?? 0;
    this.totalPaginas = data?.totalPages ?? 0;
  }

  aplicarFiltros(): void {

    this.paginaActual = 0;

    this.mensajeError = '';
    this.mensajeExito = '';

    this.cargarInventario();
  }

  buscar(): void {
    this.aplicarFiltros();
  }

  limpiarFiltros(): void {

    this.sku = '';
    this.producto = '';
    this.bodega = '';

    this.mostrarSoloBajo = false;

    this.paginaActual = 0;

    this.mensajeError = '';
    this.mensajeExito = '';

    this.cargarInventario();
  }

  cambiarFiltroBajo(): void {

    this.paginaActual = 0;

    this.mensajeError = '';
    this.mensajeExito = '';

    this.cargarInventario();
  }

  cambiarPagina(pagina: number): void {

    if (pagina < 0) {
      return;
    }

    if (pagina >= this.totalPaginas) {
      return;
    }

    this.paginaActual = pagina;

    this.cargarInventario();
  }

  paginaAnterior(): void {
    this.cambiarPagina(this.paginaActual - 1);
  }

  paginaSiguiente(): void {
    this.cambiarPagina(this.paginaActual + 1);
  }

  obtenerEstado(item: InventoryBalance): string {

    return item.lowStock
      ? 'Bajo'
      : 'Normal';
  }

  esInventarioBajo(item: InventoryBalance): boolean {

    return item.lowStock;
  }

  nuevoAjuste(): void {
    this.abrirFormularioAjuste();
  }

  abrirFormularioAjuste(): void {

    this.limpiarFormularioAjuste();

    this.mensajeError = '';
    this.mensajeExito = '';

    this.mostrarFormulario = true;
  }

  cerrarFormularioAjuste(): void {

    if (this.guardando) {
      return;
    }

    this.mostrarFormulario = false;
  }

  cancelar(): void {
    this.cerrarFormularioAjuste();
  }

  limpiarFormularioAjuste(): void {

    this.ajusteVariante = null;
    this.ajusteBodega = null;
    this.ajusteCantidad = null;

    this.ajusteMotivo = '';
    this.ajusteDocumento = '';

    this.guardando = false;
  }

  private validarAjuste(): boolean {

    this.mensajeError = '';

    if (
      this.ajusteVariante === null ||
      this.ajusteVariante <= 0
    ) {

      this.mensajeError =
        'La variante es obligatoria.';

      return false;
    }

    if (
      this.ajusteBodega === null ||
      this.ajusteBodega <= 0
    ) {

      this.mensajeError =
        'La bodega es obligatoria.';

      return false;
    }

    if (
      this.ajusteCantidad === null ||
      this.ajusteCantidad === 0
    ) {

      this.mensajeError =
        'La cantidad del ajuste es obligatoria y no puede ser cero.';

      return false;
    }

    if (!this.ajusteMotivo.trim()) {

      this.mensajeError =
        'El motivo del ajuste es obligatorio.';

      return false;
    }

    if (
      this.ajusteMotivo.trim().length > 500
    ) {

      this.mensajeError =
        'El motivo no puede superar los 500 caracteres.';

      return false;
    }

    if (
      this.ajusteDocumento.trim().length > 255
    ) {

      this.mensajeError =
        'El documento origen no puede superar 255 caracteres.';

      return false;
    }

    return true;
  }

  guardarAjuste(): void {

    if (!this.validarAjuste()) {
      this.mostrarFormulario = false;
      this.cdr.detectChanges();
      return;
    }

    const request: InventoryAdjustmentRequest = {
      variantId: this.ajusteVariante!,
      warehouseId: this.ajusteBodega!,
      quantity: this.ajusteCantidad!,
      reason: this.ajusteMotivo.trim(),
      sourceDocument:
        this.ajusteDocumento.trim() || undefined
    };

    this.guardando = true;

    this.mensajeError = '';
    this.mensajeExito = '';

    this.inventarioService
      .registrarAjuste(request)
      .pipe(
        finalize(() => {

          this.guardando = false;

          this.cdr.detectChanges();

        })
      )
      .subscribe({

        next: (response) => {

          this.mostrarFormulario = false;

          this.mensajeExito =
            response.message ||
            'El ajuste de inventario fue registrado correctamente.';

          this.cargarInventario();
        },

        error: (error) => {

          this.mostrarFormulario = false;

          if (error?.status === 400) {

            this.mensajeError =
              error?.error?.message ||
              'Los datos del ajuste no son válidos.';

          } else if (error?.status === 409) {

            this.mensajeError =
              error?.error?.message ||
              'El ajuste no puede realizarse porque produciría un inventario no permitido.';

          } else {

            this.mensajeError =
              error?.error?.message ||
              'No fue posible registrar el ajuste.';
          }

          this.cdr.detectChanges();
        }

      });
  }

  generarExcel(): void {
    if (this.inventario.length === 0) {
      this.mensajeError = 'No hay registros visibles para exportar.';
      return;
    }

    const encabezados = [
      'SKU',
      'Código producto',
      'Producto',
      'Código bodega',
      'Bodega',
      'Disponible',
      'Reservado',
      'Mínimo',
      'Estado'
    ];

    const filas = this.inventario.map(item => [
      item.sku,
      item.productCode,
      item.productName,
      item.warehouseCode,
      item.warehouseName,
      item.available,
      item.reserved,
      item.minimum,
      this.obtenerEstado(item)
    ]);

    const contenido = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body>
<table border="1">
  <thead><tr>${encabezados.map(valor => `<th>${this.escaparHtml(valor)}</th>`).join('')}</tr></thead>
  <tbody>${filas.map(fila => `<tr>${fila.map(valor => `<td>${this.escaparHtml(String(valor ?? ''))}</td>`).join('')}</tr>`).join('')}</tbody>
</table>
</body>
</html>`;

    const blob = new Blob(['\ufeff', contenido], {
      type: 'application/vnd.ms-excel;charset=utf-8;'
    });

    this.descargarArchivo(blob, this.nombreReporte('inventario', 'xls'));
  }

  generarPdf(): void {
    if (this.inventario.length === 0) {
      this.mensajeError = 'No hay registros visibles para exportar.';
      return;
    }

    const lineas = this.inventario.map(item => [
      item.sku,
      item.productName,
      item.warehouseName,
      String(item.available),
      String(item.reserved),
      String(item.minimum),
      this.obtenerEstado(item)
    ]);

    const pdf = this.construirPdf(lineas);
    const blob = new Blob([pdf.buffer as ArrayBuffer], { type: 'application/pdf' });
    this.descargarArchivo(blob, this.nombreReporte('inventario', 'pdf'));
  }

  private construirPdf(filas: string[][]): Uint8Array {
    const anchoPagina = 842;
    const altoPagina = 595;
    const margenX = 32;
    const margenSuperior = 48;
    const altoFila = 17;
    const filasPorPagina = 26;
    const posicionesX = [32, 125, 285, 455, 545, 620, 690];
    const anchosTexto = [16, 27, 27, 12, 12, 12, 12];
    const encabezados = ['SKU', 'Producto', 'Bodega', 'Disponible', 'Reservado', 'Minimo', 'Estado'];

    const paginas: string[] = [];

    for (let inicio = 0; inicio < filas.length; inicio += filasPorPagina) {
      const bloque = filas.slice(inicio, inicio + filasPorPagina);
      const comandos: string[] = [];

      comandos.push('BT');
      comandos.push('/F1 15 Tf');
      comandos.push(`${margenX} ${altoPagina - margenSuperior} Td`);
      comandos.push(`(${this.escaparPdf('Reporte de inventario - TexERP')}) Tj`);
      comandos.push('ET');

      const yEncabezado = altoPagina - margenSuperior - 32;
      comandos.push('0.93 0.95 0.98 rg');
      comandos.push(`${margenX - 4} ${yEncabezado - 5} ${anchoPagina - (margenX * 2) + 8} 18 re f`);
      comandos.push('0 0 0 rg');

      encabezados.forEach((encabezado, indice) => {
        comandos.push('BT');
        comandos.push('/F1 8 Tf');
        comandos.push(`${posicionesX[indice]} ${yEncabezado} Td`);
        comandos.push(`(${this.escaparPdf(encabezado)}) Tj`);
        comandos.push('ET');
      });

      bloque.forEach((fila, indiceFila) => {
        const y = yEncabezado - ((indiceFila + 1) * altoFila);
        fila.forEach((valor, indiceColumna) => {
          const texto = this.limitarTexto(valor, anchosTexto[indiceColumna]);
          comandos.push('BT');
          comandos.push('/F1 7.5 Tf');
          comandos.push(`${posicionesX[indiceColumna]} ${y} Td`);
          comandos.push(`(${this.escaparPdf(texto)}) Tj`);
          comandos.push('ET');
        });
      });

      paginas.push(comandos.join('\n'));
    }

    const objetos: string[] = [];
    const paginasIds: number[] = [];

    objetos.push('<< /Type /Catalog /Pages 2 0 R >>');
    objetos.push('');
    objetos.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');

    paginas.forEach(contenido => {
      const paginaId = objetos.length + 1;
      const contenidoId = paginaId + 1;
      paginasIds.push(paginaId);
      objetos.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${anchoPagina} ${altoPagina}] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contenidoId} 0 R >>`);
      objetos.push(`<< /Length ${this.longitudBytes(contenido)} >>\nstream\n${contenido}\nendstream`);
    });

    objetos[1] = `<< /Type /Pages /Kids [${paginasIds.map(id => `${id} 0 R`).join(' ')}] /Count ${paginasIds.length} >>`;

    let documento = '%PDF-1.4\n';
    const offsets: number[] = [0];

    objetos.forEach((objeto, indice) => {
      offsets.push(this.longitudBytes(documento));
      documento += `${indice + 1} 0 obj\n${objeto}\nendobj\n`;
    });

    const inicioXref = this.longitudBytes(documento);
    documento += `xref\n0 ${objetos.length + 1}\n`;
    documento += '0000000000 65535 f \n';

    for (let indice = 1; indice <= objetos.length; indice++) {
      documento += `${String(offsets[indice]).padStart(10, '0')} 00000 n \n`;
    }

    documento += `trailer\n<< /Size ${objetos.length + 1} /Root 1 0 R >>\nstartxref\n${inicioXref}\n%%EOF`;

    return this.aBytesWinAnsi(documento);
  }

  private limitarTexto(valor: string, maximo: number): string {
    const texto = (valor ?? '').replace(/\s+/g, ' ').trim();
    return texto.length > maximo
      ? `${texto.slice(0, Math.max(0, maximo - 3))}...`
      : texto;
  }

  private escaparPdf(valor: string): string {
    return valor
      .replace(/\\/g, '\\\\')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)');
  }

  private aBytesWinAnsi(valor: string): Uint8Array {
    const bytes = new Uint8Array(valor.length);

    for (let indice = 0; indice < valor.length; indice++) {
      const codigo = valor.charCodeAt(indice);
      bytes[indice] = codigo <= 255 ? codigo : 63;
    }

    return bytes;
  }

  private longitudBytes(valor: string): number {
    return this.aBytesWinAnsi(valor).length;
  }

  private escaparHtml(valor: string): string {
    return valor
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private nombreReporte(prefijo: string, extension: string): string {
    const fecha = new Date();
    const sello = [
      fecha.getFullYear(),
      String(fecha.getMonth() + 1).padStart(2, '0'),
      String(fecha.getDate()).padStart(2, '0')
    ].join('-');

    return `${prefijo}-${sello}.${extension}`;
  }

  private descargarArchivo(blob: Blob, nombre: string): void {
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = nombre;
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    URL.revokeObjectURL(url);
  }

}
