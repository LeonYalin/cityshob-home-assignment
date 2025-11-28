import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // For cookie-based auth, we need to include credentials in all requests
  const authReq = req.clone({
    setHeaders: {},
    withCredentials: true
  });

  // Handle the request and catch any auth errors
  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // If we get a 401 Unauthorized on non-auth endpoints, force logout
      // Skip auth handling for /auth/me endpoint to avoid circular dependency during initialization
      if (error.status === 401 && !req.url.includes('/auth/me')) {
        const authService = inject(AuthService);
        const router = inject(Router);
        authService.forceLogout();
        router.navigate(['/login']);
      }
      
      return throwError(() => error);
    })
  );
};