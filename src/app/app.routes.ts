import { Routes } from '@angular/router';

import { DashboardComponent } from './pages/dashboard/dashboard';
import { Usuarios } from './pages/usuarios/usuarios';
import { UnauthorizedComponent } from './pages/unauthorized/unauthorized';

import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { Login } from './pages/login/login';
import { VariantesComponent } from './pages/varianteProducto/variante.producto';
import { MainLayout } from './layout/menu/main-layout';
import { ProveedoresComponent } from './pages/proveedores/proveedores';
import { ClientesComponent } from './pages/clientes/clientes.component';
import { BodegasComponent } from './pages/bodegas/bodegas.component';

export const routes: Routes = [
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
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard'
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
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];