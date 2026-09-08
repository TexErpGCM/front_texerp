import { Routes } from '@angular/router';


import { DashboardComponent } from './pages/dashboard/dashboard';
import { Usuarios } from './pages/usuarios/usuarios';
import { UnauthorizedComponent } from './pages/unauthorized/unauthorized';

import { MainLayout } from './layout/main-layout';

import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { Login } from './pages/login/login';

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
      }
    ]
  },

  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'login'
  },

  {
    path: '**',
    redirectTo: 'login'
  }
];