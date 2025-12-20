import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptorFn: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  console.log('🔒 Interceptor - Token:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN');
  console.log('🔒 Interceptor - URL:', req.url);

  if (token && token !== 'undefined' && token !== 'null') {
    const cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log('✅ Token agregado a la petición');
    return next(cloned);
  }

  console.log('⚠️ No se agregó token a la petición');
  return next(req);
};
