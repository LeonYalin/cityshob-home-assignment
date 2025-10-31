import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';

export interface User {
  id: string;
  username: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = 'http://localhost:4000/api/auth';
  private readonly TOKEN_KEY = 'todo_app_token';
  private readonly USER_KEY = 'todo_app_user';

  // Reactive state management
  private readonly currentUserSubject = new BehaviorSubject<User | null>(null);
  private readonly isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  
  // Angular signals for modern reactive programming
  public readonly currentUser = signal<User | null>(null);
  public readonly isAuthenticated = signal<boolean>(false);
  
  // Observables for compatibility
  public readonly currentUser$ = this.currentUserSubject.asObservable();
  public readonly isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadUserFromStorage();
  }

  /**
   * Login user with email and password
   */
  login(loginData: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/login`, loginData)
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            this.setAuthData(response.data.user, response.data.token);
          }
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Register new user
   */
  register(registerData: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/register`, registerData)
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            this.setAuthData(response.data.user, response.data.token);
          }
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Logout user and clear all auth data
   */
  logout(): Observable<any> {
    return this.http.post(`${this.API_URL}/logout`, {})
      .pipe(
        tap(() => this.clearAuthData()),
        catchError(() => {
          // Even if logout fails on server, clear local data
          this.clearAuthData();
          return of(null);
        })
      );
  }

  /**
   * Get current user profile from server
   */
  getCurrentUser(): Observable<{ success: boolean; data: { user: User } }> {
    return this.http.get<{ success: boolean; data: { user: User } }>(`${this.API_URL}/me`)
      .pipe(
        tap(response => {
          if (response.success && response.data.user) {
            this.updateUser(response.data.user);
          }
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Get stored JWT token
   */
  getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(this.TOKEN_KEY);
    }
    return null;
  }

  /**
   * Check if user is authenticated
   */
  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      // Basic JWT expiration check
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Date.now() / 1000;
      
      if (payload.exp < now) {
        this.clearAuthData();
        return false;
      }
      
      return true;
    } catch (error) {
      this.clearAuthData();
      return false;
    }
  }

  /**
   * Force logout user (used when token is invalid)
   */
  forceLogout(): void {
    this.clearAuthData();
  }

  /**
   * Set authentication data after successful login/register
   */
  private setAuthData(user: User, token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.TOKEN_KEY, token);
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    }
    
    this.updateAuthState(user, true);
  }

  /**
   * Update user data without changing token
   */
  private updateUser(user: User): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    }
    
    this.currentUser.set(user);
    this.currentUserSubject.next(user);
  }

  /**
   * Update authentication state
   */
  private updateAuthState(user: User | null, authenticated: boolean): void {
    this.currentUser.set(user);
    this.isAuthenticated.set(authenticated);
    this.currentUserSubject.next(user);
    this.isAuthenticatedSubject.next(authenticated);
  }

  /**
   * Clear all authentication data
   */
  private clearAuthData(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
    }
    
    this.updateAuthState(null, false);
  }

  /**
   * Load user data from localStorage on app init
   */
  private loadUserFromStorage(): void {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem(this.TOKEN_KEY);
      const userStr = localStorage.getItem(this.USER_KEY);
      
      if (token && userStr && this.isLoggedIn()) {
        try {
          const user: User = JSON.parse(userStr);
          this.updateAuthState(user, true);
        } catch (error) {
          this.clearAuthData();
        }
      } else {
        this.clearAuthData();
      }
    }
  }

  /**
   * Handle HTTP errors
   */
  private handleError = (error: HttpErrorResponse): Observable<never> => {
    console.error('Auth Service Error:', error);
    
    if (error.status === 401) {
      this.forceLogout();
    }
    
    throw error;
  };
}