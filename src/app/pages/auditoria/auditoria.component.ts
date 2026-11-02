
import {
  ChangeDetectorRef,
  Component,
  OnInit,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { ComercialService } from '../../core/services/comercial.service';
import {
  FiltrosAuditoria,
  RegistroAuditoria
} from '../../core/models/comercial.model';

interface CambioAuditoria {
  campo: string;
  anterior: string;
  nuevo: string;
}

@Component({
  selector: 'app-auditoria',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './auditoria.component.html',
  styleUrl: './auditoria.component.scss'
})
export class AuditoriaComponent implements OnInit {

  private readonly service = inject(ComercialService);
  private readonly cdr = inject(ChangeDetectorRef);

  filtros: FiltrosAuditoria = {};
  registros: RegistroAuditoria[] = [];
  seleccionado: RegistroAuditoria | null = null;

  cambiosSeleccionados: CambioAuditoria[] = [];

  cargando = false;
  generandoPdf = false;
  error = '';

  pagina = 0;
  totalPaginas = 0;
  totalElementos = 0;

  private readonly nombresCampos: Record<string, string> = {
    id: 'Identificador',
    code: 'Código',
    name: 'Nombre',
    active: 'Estado',
    fabricType: 'Tipo de tela',
    composition: 'Composición',
    description: 'Descripción',
    price: 'Precio',
    quantity: 'Cantidad',
    stock: 'Existencias',
    status: 'Estado',
    email: 'Correo electrónico',
    phone: 'Teléfono',
    address: 'Dirección',
    createdAt: 'Fecha de creación',
    updatedAt: 'Última actualización'
  };

  private readonly camposIgnorados = new Set([
    'id',
    'createdAt',
    'updatedAt'
  ]);

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    this.error = '';

    this.service
      .listarAuditoria(this.pagina, 20, this.filtros)
      .pipe(
        finalize(() => {
          this.cargando = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: r => {
          this.registros = r.data?.content ?? [];
          this.totalPaginas = r.data?.totalPages ?? 0;
          this.totalElementos = r.data?.totalElements ?? 0;
        },
        error: e => {
          this.error =
            e.error?.message ||
            'No fue posible consultar los registros de auditoría.';
        }
      });
  }

  filtrar(): void {
    this.pagina = 0;
    this.cargar();
  }

  limpiar(): void {
    this.filtros = {};
    this.filtrar();
  }

  cambiarPagina(n: number): void {
    if (n >= 0 && n < this.totalPaginas) {
      this.pagina = n;
      this.cargar();
    }
  }

  abrirDetalle(registro: RegistroAuditoria): void {
    this.seleccionado = registro;

    this.cambiosSeleccionados = this.obtenerCambios(
      registro.oldValue,
      registro.newValue
    );
  }

  cerrarDetalle(): void {
    this.seleccionado = null;
    this.cambiosSeleccionados = [];
  }

  generarPdf(): void {
    if (this.generandoPdf || this.cargando) {
      return;
    }

    if (this.registros.length === 0) {
      this.error = 'No hay registros disponibles para exportar.';
      return;
    }

    this.generandoPdf = true;
    this.error = '';

    try {
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const anchoPagina = pdf.internal.pageSize.getWidth();

      // Encabezado
      pdf.setFillColor(15, 35, 69);
      pdf.rect(0, 0, anchoPagina, 35, 'F');

      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(18);
      pdf.text('TEXERP', 14, 15);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.text('Sistema de Gestión Textil', 14, 22);
      pdf.text('Reporte de auditoría', 14, 29);

      pdf.setTextColor(40, 55, 75);
      pdf.setFontSize(9);

      const fechaGeneracion = new Date().toLocaleString('es-CO');

      pdf.text(
        `Generado: ${fechaGeneracion}`,
        14,
        44
      );

      pdf.text(
        `Registros exportados: ${this.registros.length}`,
        14,
        50
      );

      pdf.text(
        `Página consultada: ${this.pagina + 1} de ${this.totalPaginas}`,
        14,
        56
      );

      const filas = this.registros.map(registro => [
        this.formatearFecha(registro.createdAt),
        registro.entity ?? '—',
        String(registro.entityId ?? '—'),
        registro.action ?? '—',
        registro.username || registro.user || '—',
        this.resumirCambios(
          registro.oldValue,
          registro.newValue
        )
      ]);

      autoTable(pdf, {
        startY: 64,
        margin: {
          left: 14,
          right: 14,
          bottom: 18
        },
        head: [[
          'Fecha',
          'Entidad',
          'ID',
          'Acción',
          'Usuario',
          'Cambios realizados'
        ]],
        body: filas,
        theme: 'grid',
        styles: {
          font: 'helvetica',
          fontSize: 8,
          cellPadding: 3,
          overflow: 'linebreak',
          valign: 'top',
          textColor: [40, 55, 75],
          lineColor: [226, 232, 240]
        },
        headStyles: {
          fillColor: [15, 35, 69],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        },
        columnStyles: {
          0: { cellWidth: 37 },
          1: { cellWidth: 31 },
          2: { cellWidth: 15 },
          3: { cellWidth: 27 },
          4: { cellWidth: 52 },
          5: { cellWidth: 'auto' }
        },
        didDrawPage: data => {
          const altoPagina = pdf.internal.pageSize.getHeight();

          pdf.setFontSize(8);
          pdf.setTextColor(120, 130, 145);

          pdf.text(
            'TexERP - Reporte de auditoría',
            14,
            altoPagina - 9
          );

          pdf.text(
            `Página ${data.pageNumber}`,
            anchoPagina - 14,
            altoPagina - 9,
            { align: 'right' }
          );
        }
      });

      const fechaArchivo = new Date()
        .toISOString()
        .slice(0, 10);

      pdf.save(`auditoria_texerp_${fechaArchivo}.pdf`);

    } catch (error) {
      console.error('Error al generar PDF:', error);
      this.error = 'No fue posible generar el PDF de auditoría.';
    } finally {
      this.generandoPdf = false;
      this.cdr.detectChanges();
    }
  }

  private resumirCambios(
    oldValue: unknown,
    newValue: unknown
  ): string {
    const cambios = this.obtenerCambios(oldValue, newValue);

    if (!cambios.length) {
      return 'Sin cambios detallados';
    }

    return cambios
      .map(cambio =>
        `${cambio.campo}: ${cambio.anterior} -> ${cambio.nuevo}`
      )
      .join('\n');
  }

  private formatearFecha(fecha: unknown): string {
    if (!fecha) {
      return '—';
    }

    const valor = new Date(String(fecha));

    if (Number.isNaN(valor.getTime())) {
      return '—';
    }

    return valor.toLocaleString('es-CO');
  }

  private obtenerCambios(
    oldValue: unknown,
    newValue: unknown
  ): CambioAuditoria[] {

    const anterior = this.parsearValor(oldValue);
    const nuevo = this.parsearValor(newValue);

    if (!this.esObjeto(anterior) && !this.esObjeto(nuevo)) {
      if (this.sonIguales(anterior, nuevo)) {
        return [];
      }

      return [{
        campo: 'Valor',
        anterior: this.formatearValor(anterior),
        nuevo: this.formatearValor(nuevo)
      }];
    }

    const objetoAnterior = this.esObjeto(anterior) ? anterior : {};
    const objetoNuevo = this.esObjeto(nuevo) ? nuevo : {};

    const campos = new Set([
      ...Object.keys(objetoAnterior),
      ...Object.keys(objetoNuevo)
    ]);

    const cambios: CambioAuditoria[] = [];

    for (const campo of campos) {
      if (this.camposIgnorados.has(campo)) {
        continue;
      }

      const valorAnterior = objetoAnterior[campo];
      const valorNuevo = objetoNuevo[campo];

      if (this.sonIguales(valorAnterior, valorNuevo)) {
        continue;
      }

      cambios.push({
        campo: this.obtenerNombreCampo(campo),
        anterior: this.formatearValor(valorAnterior, campo),
        nuevo: this.formatearValor(valorNuevo, campo)
      });
    }

    return cambios;
  }

  private parsearValor(valor: unknown): unknown {
    if (valor == null) {
      return null;
    }

    if (typeof valor !== 'string') {
      return valor;
    }

    if (!valor.trim()) {
      return null;
    }

    try {
      return JSON.parse(valor);
    } catch {
      return valor;
    }
  }

  private esObjeto(
    valor: unknown
  ): valor is Record<string, unknown> {
    return (
      typeof valor === 'object' &&
      valor !== null &&
      !Array.isArray(valor)
    );
  }

  private sonIguales(a: unknown, b: unknown): boolean {
    return JSON.stringify(a) === JSON.stringify(b);
  }

  private obtenerNombreCampo(campo: string): string {
    return this.nombresCampos[campo] ??
      campo
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/_/g, ' ')
        .replace(/^./, letra => letra.toUpperCase());
  }

  private formatearValor(
    valor: unknown,
    campo?: string
  ): string {

    if (valor === null || valor === undefined) {
      return '—';
    }

    if (typeof valor === 'boolean') {
      if (campo === 'active') {
        return valor ? 'Activo' : 'Inactivo';
      }

      return valor ? 'Sí' : 'No';
    }

    if (typeof valor === 'object') {
      return JSON.stringify(valor, null, 2);
    }

    const texto = String(valor);

    return texto.trim() ? texto : '—';
  }
}
