import { Injectable, inject } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable, map, take, filter } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  private authService = inject(AuthService);
  private router = inject(Router);

  canActivate(): Observable<boolean | UrlTree> {
    // Wait for auth initialization to complete, then check authentication
    return this.authService.isAuthInitialized$.pipe(
      filter(initialized => initialized === true),
      take(1),
      map(() => {
        if (this.authService.isLoggedIn()) {
          return true;
        } else {
          return this.router.createUrlTree(['/login']);
        }
      })
    );
  }
}

@Injectable({
  providedIn: 'root'
})
export class NoAuthGuard implements CanActivate {
  private authService = inject(AuthService);
  private router = inject(Router);

  canActivate(): Observable<boolean | UrlTree> {
    // Wait for auth initialization to complete, then check authentication
    return this.authService.isAuthInitialized$.pipe(
      filter(initialized => initialized === true),
      take(1),
      map(() => {
        if (!this.authService.isLoggedIn()) {
          return true;
        } else {
          return this.router.createUrlTree(['/todos']);
        }
      })
    );
  }
}