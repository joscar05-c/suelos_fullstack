import { Routes } from '@angular/router';
import { firebaseAuthGuard } from './guards/firebase-auth.guard';
import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/landing/landing.page').then( m => m.LandingPage),
  },
  {
    path: 'onboarding',
    loadComponent: () => import('./pages/onboarding/onboarding.page').then( m => m.OnboardingPage),
  },
  {
    path: 'phone-login',
    loadComponent: () => import('./pages/phone-login/phone-login.page').then( m => m.PhoneLoginPage)
  },
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then( m => m.HomePage)
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
    path: 'admin',
    loadComponent: () => import('./pages/admin/admin.page').then( m => m.AdminPage),
    canActivate: [firebaseAuthGuard, adminGuard]
  },
  {
    path: 'privacidad',
    loadComponent: () => import('./pages/privacidad/privacidad.page').then( m => m.PrivacidadPage)
  },
  {
    path: 'privacy-policy',
    redirectTo: 'privacidad',
    pathMatch: 'full'
  },
];
