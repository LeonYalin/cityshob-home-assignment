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
    // No token in response - it's in HTTP-only cookie
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
    this.initializeAuthState();
  }

  /**
   * Login user with email and password
   */
  login(loginData: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/login`, loginData)
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            this.setAuthData(response.data.user);
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
            this.setAuthData(response.data.user);
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
   * Check if user is authenticated
   * With cookie-based auth, we check the reactive state
   */
  isLoggedIn(): boolean {
    return this.isAuthenticated();
  }

  /**
   * Force logout user (used when token is invalid)
   */
  forceLogout(): void {
    this.clearAuthData();
  }

  /**
   * Set authentication data after successful login/register
   * With cookie-based auth, we only keep user data in memory, token is in HTTP-only cookie
   */
  private setAuthData(user: User): void {
    this.updateAuthState(user, true);
  }

  /**
   * Update user data without changing authentication state
   */
  private updateUser(user: User): void {
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
   * With cookie-based auth, we only clear memory state, server will clear cookie
   */
  private clearAuthData(): void {
    this.updateAuthState(null, false);
  }

  /**
   * Initialize authentication state on app startup
   * With cookie-based auth, we check if user is authenticated by calling the server
   * The server will validate the HTTP-only cookie automatically
   */
  private initializeAuthState(): void {
    // Check authentication status with server by calling /me endpoint
    // If cookie exists and is valid, we'll get user data back
    this.getCurrentUser().subscribe({
      next: (response) => {
        if (response.success && response.data.user) {
          // User is authenticated, set state
          this.updateAuthState(response.data.user, true);
        }
      },
      error: () => {
        // No valid authentication, ensure state is clear
        this.updateAuthState(null, false);
      }
    });
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