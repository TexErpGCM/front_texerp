import {
  ChangeDetectorRef,
  Component,
  OnInit
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { finalize } from 'rxjs';

import {
  Product,
  ProductService
} from '../../core/services/producto.service';

import { LoadingComponent } from '../../layout/loading/loading.component';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    LoadingComponent
  ],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss'
})
export class LandingComponent implements OnInit {

  productos: Product[] = [];

  cargandoProductos = false;
  mensajeError = '';

  constructor(
    private productService: ProductService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarProductos();
  }

  cargarProductos(): void {

    this.cargandoProductos = true;
    this.mensajeError = '';

    this.productService
      .listar(
        '',
        '',
        '',
        true,
        0,
        6
      )
      .pipe(
        finalize(() => {
          this.cargandoProductos = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({

        next: (response) => {
          this.productos =
            response.data?.content ?? [];
        },

        error: (error) => {
          this.productos = [];

          this.mensajeError =
            error?.error?.message ||
            'No fue posible cargar los productos.';
        }

      });
  }

  obtenerDescripcionProducto(
    producto: Product
  ): string {

    if (producto.composition) {
      return producto.composition;
    }

    return 'Producto disponible en nuestro catálogo.';
  }

}