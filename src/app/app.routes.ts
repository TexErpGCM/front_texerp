import { Routes } from '@angular/router';

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

import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { LandingComponent } from './layout/landing/landing.component';

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
      }

    ]
  },

  {
    path: '**',
    redirectTo: ''
  }

];