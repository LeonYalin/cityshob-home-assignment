import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { 
  type User, 
  type LoginRequest, 
  type RegisterRequest, 
  type LoginResponse, 
  type RegisterResponse, 
  type LogoutResponse, 
  type GetCurrentUserResponse 
} from '@real-time-todo/common';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = `${environment.apiUrl}/auth`;

  // BehaviorSubjects for reactive programming
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  
  private isAuthInitializedSubject = new BehaviorSubject<boolean>(false);
  public isAuthInitialized$ = this.isAuthInitializedSubject.asObservable();

  // WebSocket service - lazy loaded to avoid circular dependency
  private wsService: { connect: () => void; disconnect: () => void } | null = null;

  constructor(private http: HttpClient) {
    this.initializeAuthState();
  }

  /**
   * Set WebSocket service (called after WebSocket service is initialized)
   */
  setWebSocketService(wsService: { connect: () => void; disconnect: () => void }): void {
    this.wsService = wsService;
  }

  /**
   * Login user with email and password
   */
  login(loginData: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API_URL}/login`, loginData)
      .pipe(
        tap(response => {
          if (response.success && response.data?.user) {
            this.setAuthData(response.data.user);
          }
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Register new user
   */
  register(registerData: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.API_URL}/register`, registerData)
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
  logout(): Observable<LogoutResponse> {
    return this.http.post<LogoutResponse>(`${this.API_URL}/logout`, {})
      .pipe(
        tap(() => this.clearAuthData()),
        catchError(() => {
          // Even if logout fails on server, clear local data
          this.clearAuthData();
          return of({ success: true, message: 'Logged out locally' });
        })
      );
  }

  /**
   * Get current user profile from server
   */
  getCurrentUser(): Observable<GetCurrentUserResponse> {
    return this.http.get<GetCurrentUserResponse>(`${this.API_URL}/me`)
      .pipe(
        tap(response => {
          if (response.success && response.data?.user) {
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
    return this.isAuthenticatedSubject.value;
  }
  
  /**
   * Get current user value
   */
  getCurrentUserValue(): User | null {
    return this.currentUserSubject.value;
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
    
    // Connect WebSocket after successful login
    if (this.wsService) {
      this.wsService.connect();
    }
  }

  /**
   * Update user data without changing authentication state
   */
  private updateUser(user: User): void {
    this.currentUserSubject.next(user);
  }

  /**
   * Update authentication state
   */
  private updateAuthState(user: User | null, authenticated: boolean): void {
    this.currentUserSubject.next(user);
    this.isAuthenticatedSubject.next(authenticated);
  }

  /**
   * Clear all authentication data
   * With cookie-based auth, we only clear memory state, server will clear cookie
   */
  private clearAuthData(): void {
    this.updateAuthState(null, false);
    
    // Disconnect WebSocket on logout
    if (this.wsService) {
      this.wsService.disconnect();
    }
  }

  /**
   * Initialize authentication state on app startup
   * With cookie-based auth, we check if user is authenticated by calling the server
   * The server will validate the HTTP-only cookie automatically
   */
  private initializeAuthState(): void {
    // Check authentication status with server by calling /me endpoint
    // If cookie exists and is valid, we'll get user data back
    this.http.get<GetCurrentUserResponse>(`${this.API_URL}/me`).pipe(
      tap(response => {
        if (response.success && response.data?.user) {
          this.updateUser(response.data.user);
        }
      }),
      catchError(() => {
        // On error during initialization, just return empty - don't call forceLogout
        // This is expected when user is not authenticated
        return of(null);
      })
    ).subscribe({
      next: (response) => {
        if (response && response.success && response.data?.user) {
          // User is authenticated, set state
          this.updateAuthState(response.data.user, true);
          
          // Connect WebSocket if user is authenticated
          if (this.wsService) {
            this.wsService.connect();
          }
        } else {
          // No valid authentication, ensure state is clear
          this.updateAuthState(null, false);
        }
        // Mark initialization as complete
        this.isAuthInitializedSubject.next(true);
      },
      error: () => {
        // This shouldn't happen since we catch errors above, but just in case
        this.updateAuthState(null, false);
        this.isAuthInitializedSubject.next(true);
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