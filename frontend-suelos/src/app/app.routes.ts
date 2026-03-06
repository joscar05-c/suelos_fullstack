import { Routes } from '@angular/router';
import { firebaseAuthGuard } from './guards/firebase-auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'phone-login',
    pathMatch: 'full',
  },
  {
    path: 'phone-login',
    loadComponent: () => import('./pages/phone-login/phone-login.page').then( m => m.PhoneLoginPage)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard.page').then( m => m.DashboardPage),
    canActivate: [firebaseAuthGuard]
  },
  {
    path: 'chacra-detalle/:id',
    loadComponent: () => import('./pages/chacra-detalle/chacra-detalle.page').then( m => m.ChacraDetallePage),
    canActivate: [firebaseAuthGuard]
  },
  {
    path: 'calculo-detalle/:chacraId/:calculoId',
    loadComponent: () => import('./pages/calculo-detalle/calculo-detalle.page').then( m => m.CalculoDetallePage),
    canActivate: [firebaseAuthGuard]
  },
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then( m => m.HomePage),
    canActivate: [firebaseAuthGuard]
  },
];
