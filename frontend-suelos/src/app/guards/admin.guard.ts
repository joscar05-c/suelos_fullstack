import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { FirebaseAuthService } from '../services/firebase-auth.service';
import { ToastController } from '@ionic/angular';
import { map, filter, take, timeout, catchError, of } from 'rxjs';

export const adminGuard: CanActivateFn = (route, state) => {
  const firebaseAuth = inject(FirebaseAuthService);
  const router = inject(Router);
  const toastCtrl = inject(ToastController);

  const currentUser = firebaseAuth.currentAppUser;
  if (currentUser) {
    if (currentUser.rol === 'ADMIN') {
      return true;
    }
    toastCtrl.create({
      message: 'Acceso restringido: Se requiere perfil de Administrador.',
      duration: 3000,
      color: 'warning',
      position: 'bottom',
    }).then(t => t.present());
    router.navigate(['/dashboard']);
    return false;
  }

  return firebaseAuth.appUser$.pipe(
    filter(u => u !== null),
    take(1),
    timeout(3000),
    map(user => {
      if (user?.rol === 'ADMIN') {
        return true;
      }
      toastCtrl.create({
        message: 'Acceso restringido: Se requiere perfil de Administrador.',
        duration: 3000,
        color: 'warning',
        position: 'bottom',
      }).then(t => t.present());
      router.navigate(['/dashboard']);
      return false;
    }),
    catchError(() => {
      router.navigate(['/dashboard']);
      return of(false);
    })
  );
};
