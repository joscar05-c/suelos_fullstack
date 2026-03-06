import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { FirebaseAuthService } from '../services/firebase-auth.service';
import { map } from 'rxjs';

export const firebaseAuthGuard: CanActivateFn = (route, state) => {
  const firebaseAuth = inject(FirebaseAuthService);
  const router = inject(Router);

  return firebaseAuth.firebaseUser$.pipe(
    map(user => {
      if (user) {
        return true;
      }
      
      // Redirigir a phone-login
      router.navigate(['/phone-login']);
      return false;
    })
  );
};
