import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { from, switchMap } from 'rxjs';
import { FirebaseAuthService } from '../services/firebase-auth.service';

export const firebaseInterceptor: HttpInterceptorFn = (req, next) => {
  const firebaseAuth = inject(FirebaseAuthService);

  // Solo agregar token a peticiones a nuestra API
  if (!req.url.includes('localhost:3000') && !req.url.includes('api')) {
    return next(req);
  }

  console.log('🔥 Firebase Interceptor - URL:', req.url);

  return from(firebaseAuth.getIdToken()).pipe(
    switchMap(token => {
      if (token) {
        console.log('🔥 Token Firebase agregado:', token.substring(0, 20) + '...');

        const cloned = req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`
          }
        });

        return next(cloned);
      }

      console.log('⚠️ No hay token Firebase disponible');
      return next(req);
    })
  );
};
