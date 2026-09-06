import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { Login } from './pages/login/login';
import { Dashboard } from './pages/dashboard/dashboard';
import { Usuarios } from './pages/usuarios/usuarios';
import { Unauthorized } from './pages/unauthorized/unauthorized';
import { MainLayout } from './layout/main-layout';

export const routes: Routes = [

{path: '',pathMatch: 'full', redirectTo: 'login'},
{ path: 'login',component: Login, canActivate: [guestGuard]},

  {
    path: '',
    component: MainLayout,
    canActivate: [authGuard],

    children: [
      {path: 'dashboard',component: Dashboard},
      {path: 'usuario', component: Usuarios},
      {path: 'unauthorized',component: Unauthorized}
    ]

  },
  
  { path: '**',redirectTo: 'login'}
];