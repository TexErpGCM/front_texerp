import { Routes } from '@angular/router';
import { AnaliticaComponent } from './pages/analitica/analitica.component';

import { DashboardComponent } from './pages/dashboard/dashboard';
import { Usuarios } from './pages/usuarios/usuarios';
import { UnauthorizedComponent } from './pages/unauthorized/unauthorized';
import { Login } from './pages/login/login';
import { VariantesComponent } from './pages/varianteProducto/variante.producto';
import { MainLayout } from './layout/menu/main-layout';
import { ProveedoresComponent } from './pages/proveedores/proveedores';
import { ClientesComponent } from './pages/clientes/clientes.component';
import { BodegasComponent } from './pages/bodegas/bodegas.component';
import { ListarInventarioComponent } from './pages/inventario/inventario.component';
import { ListarProductoComponent } from './pages/producto/producto.component';
import { MovimientosComponent } from './pages/movimientos/movimientos.component';
import { CotizacionesComponent } from './pages/cotizaciones/cotizaciones.component';
import { AuditoriaComponent } from './pages/auditoria/auditoria.component';
import { OrdenesCompraComponent } from './pages/ordenes-compra/ordenes-compra.component';
import { VentasComponent } from './pages/ventas/ventas.component';

import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { LandingComponent } from './layout/landing/landing.component';
import { permissionGuard } from './core/guards/permission.guard';
import { APP_PERMISSIONS } from './core/services/permission.service';

export const routes: Routes = [

  {
    path: '',
    component: LandingComponent
  },

  {
    path: 'login',
    component: Login,
    canActivate: [guestGuard]
  },

  {
    path: '',
    component: MainLayout,
    canActivate: [authGuard],
    children: [

      {
        path: 'analitica',
        component: AnaliticaComponent,
        canActivate: [permissionGuard],
        data: { permissions: [APP_PERMISSIONS.DASHBOARD_READ] }
      },

      {
        path: 'dashboard',
        component: DashboardComponent
      },

      {
        path: 'usuario',
        component: Usuarios
      },

      {
        path: 'unauthorized',
        component: UnauthorizedComponent
      },

      {
        path: 'variante',
        component: VariantesComponent
      },

      {
        path: 'Proveedor',
        component: ProveedoresComponent
      },

      {
        path: 'clientes',
        component: ClientesComponent
      },

      {
        path: 'bodegas',
        component: BodegasComponent
      },

      {
        path: 'inventario',
        component: ListarInventarioComponent
      },

      {
        path: 'producto',
        component: ListarProductoComponent
      },

      {
        path: 'movimientos',
        component: MovimientosComponent
      },

      {
        path: 'cotizaciones',
        component: CotizacionesComponent,
        canActivate: [permissionGuard],
        data: { permissions: [APP_PERMISSIONS.QUOTE_READ] }
      },

      {
        path: 'ordenes-compra',
        component: OrdenesCompraComponent,
        canActivate: [permissionGuard],
        data: { permissions: [APP_PERMISSIONS.PURCHASE_ORDER_READ] }
      },

      {
        path: 'auditoria',
        component: AuditoriaComponent,
        canActivate: [permissionGuard],
        data: { permissions: [APP_PERMISSIONS.AUDIT_READ] }
      },

      {
        path: 'ventas',
        component: VentasComponent,
        canActivate: [permissionGuard],
        data: { permissions: [APP_PERMISSIONS.SALE_READ] }
      }

    ]
  },

  {
    path: '**',
    redirectTo: ''
  }

];
