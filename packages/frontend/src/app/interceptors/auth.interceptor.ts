import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  
  // For cookie-based auth, we need to include credentials in all requests
  const authReq = req.clone({
    setHeaders: {},
    withCredentials: true
  });

  // Handle the request and catch any auth errors
  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // If we get a 401 Unauthorized, force logout
      if (error.status === 401) {
        authService.forceLogout();
        // Optionally redirect to login page
        // router.navigate(['/login']);
      }
      
      return throwError(() => error);
    })
  );
};