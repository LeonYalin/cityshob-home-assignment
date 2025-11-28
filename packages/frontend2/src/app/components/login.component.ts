import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService, LoginRequest } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="login-container">
      <div class="login-wrapper">
        <!-- App Header -->
        <div class="app-header">
          <h1 class="app-title">📝 Todo Manager</h1>
          <p class="app-subtitle">Welcome back to your productivity hub</p>
        </div>

        <mat-card class="login-card">
          <mat-card-header>
            <div class="header-content">
              <mat-card-title>Sign In</mat-card-title>
              <mat-card-subtitle>Access your todo dashboard</mat-card-subtitle>
            </div>
          </mat-card-header>

          <mat-card-content>
            <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
              <div class="form-fields">
                <!-- Email Field -->
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Email</mat-label>
                  <input 
                    matInput 
                    type="email"
                    formControlName="email" 
                    placeholder="Enter your email"
                    autocomplete="email"
                  >
                  <mat-icon matSuffix color="primary">email</mat-icon>
                  <mat-error *ngIf="loginForm.get('email')?.hasError('required')">
                    Email is required
                  </mat-error>
                  <mat-error *ngIf="loginForm.get('email')?.hasError('email')">
                    Please enter a valid email address
                  </mat-error>
                </mat-form-field>

                <!-- Password Field -->
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Password</mat-label>
                  <input 
                    matInput 
                    [type]="hidePassword ? 'password' : 'text'"
                    formControlName="password" 
                    placeholder="Enter your password"
                    autocomplete="current-password"
                  >
                  <button 
                    mat-icon-button 
                    matSuffix 
                    (click)="togglePasswordVisibility()"
                    type="button"
                    [attr.aria-label]="hidePassword ? 'Show password' : 'Hide password'"
                    [attr.aria-pressed]="!hidePassword"
                  >
                    <mat-icon color="primary">{{hidePassword ? 'visibility_off' : 'visibility'}}</mat-icon>
                  </button>
                  <mat-error *ngIf="loginForm.get('password')?.hasError('required')">
                    Password is required
                  </mat-error>
                  <mat-error *ngIf="loginForm.get('password')?.hasError('minlength')">
                    Password must be at least 6 characters long
                  </mat-error>
                </mat-form-field>
              </div>
            </form>
          </mat-card-content>

          <mat-card-actions>
            <div class="action-buttons">
              <button 
                mat-raised-button 
                color="primary" 
                type="submit"
                [disabled]="loginForm.invalid || isLoading()"
                (click)="onSubmit()"
                class="login-button"
              >
                @if (isLoading()) {
                  <ng-container>
                    <mat-spinner diameter="20"></mat-spinner>
                    <span>Signing In...</span>
                  </ng-container>
                } @else {
                  <ng-container>
                    <mat-icon>login</mat-icon>
                    <span>Sign In</span>
                  </ng-container>
                }
              </button>
              
              <div class="register-link">
                <span>New to Todo Manager?</span>
                <a routerLink="/register" mat-button color="accent">
                  Create Account
                </a>
              </div>
            </div>
          </mat-card-actions>
        </mat-card>

        <!-- Features Preview -->
        <div class="features-preview">
          <div class="feature-item">
            <mat-icon color="primary">task_alt</mat-icon>
            <span>Organize your tasks</span>
          </div>
          <div class="feature-item">
            <mat-icon color="primary">priority_high</mat-icon>
            <span>Set priorities</span>
          </div>
          <div class="feature-item">
            <mat-icon color="primary">sync</mat-icon>
            <span>Real-time sync</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      position: relative;
    }

    .login-wrapper {
      width: 100%;
      max-width: 450px;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .app-header {
      text-align: center;
      color: white;
      margin-bottom: 8px;
    }

    .app-title {
      font-size: 2.5rem;
      font-weight: 700;
      margin: 0 0 8px 0;
      text-shadow: 0 2px 4px rgba(0,0,0,0.3);
    }

    .app-subtitle {
      font-size: 1.1rem;
      opacity: 0.9;
      margin: 0;
      font-weight: 300;
    }

    .login-card {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      border-radius: 16px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      overflow: hidden;
    }

    .header-content {
      width: 100%;
      text-align: center;
      padding: 8px 0;
    }

    mat-card-title {
      font-size: 1.8rem;
      font-weight: 600;
      color: #2d3748;
      margin-bottom: 4px;
    }

    mat-card-subtitle {
      color: #718096;
      font-size: 1rem;
    }

    .form-fields {
      display: flex;
      flex-direction: column;
      gap: 20px;
      padding: 8px 0;
    }

    .full-width {
      width: 100%;
    }

    .mat-mdc-form-field {
      font-size: 14px;
    }

    .mat-mdc-form-field-outline {
      border-radius: 8px;
    }

    .action-buttons {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 20px;
      padding: 8px 0;
    }

    .login-button {
      width: 100%;
      height: 48px;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 500;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
      transition: all 0.3s ease;
    }

    .login-button mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      vertical-align: text-bottom;
      margin-right: 4px;
    }

    .login-button span {
      display: flex;
      align-items: center;
      line-height: 1;
    }

    .login-button:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
    }

    .login-button:disabled {
      opacity: 0.7;
      cursor: not-allowed;
      transform: none;
    }

    .login-button mat-spinner {
      margin-right: 8px;
    }

    .register-link {
      text-align: center;
      display: flex;
      flex-direction: column;
      gap: 8px;
      color: #718096;
    }

    .register-link span {
      font-size: 14px;
    }

    .register-link a {
      font-weight: 500;
      text-decoration: none;
    }

    .features-preview {
      display: flex;
      justify-content: space-around;
      gap: 16px;
      margin-top: 16px;
    }

    .feature-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      color: white;
      opacity: 0.9;
      text-align: center;
    }

    .feature-item mat-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
    }

    .feature-item span {
      font-size: 12px;
      font-weight: 400;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .login-container {
        padding: 16px;
      }

      .app-title {
        font-size: 2rem;
      }

      .app-subtitle {
        font-size: 1rem;
      }

      .login-wrapper {
        max-width: 400px;
      }

      .features-preview {
        flex-direction: column;
        gap: 12px;
      }

      .feature-item {
        flex-direction: row;
        justify-content: center;
        gap: 12px;
      }

      .feature-item span {
        font-size: 14px;
      }
    }

    @media (max-width: 480px) {
      .login-container {
        padding: 12px;
      }

      .app-title {
        font-size: 1.75rem;
      }

      .login-wrapper {
        max-width: 100%;
      }

      .login-card {
        border-radius: 12px;
      }

      .form-fields {
        gap: 16px;
      }

      .login-button {
        height: 44px;
        font-size: 15px;
      }
    }

    /* Loading State */
    .login-button mat-spinner {
      --mdc-circular-progress-active-indicator-color: white;
    }

    /* Error State Styling */
    .mat-mdc-form-field.mat-form-field-invalid .mat-mdc-form-field-outline-thick {
      border-color: #f56565;
    }

    /* Focus State */
    .mat-mdc-form-field.mat-focused .mat-mdc-form-field-outline-thick {
      border-color: #667eea;
    }

    /* Accessibility */
    @media (prefers-reduced-motion: reduce) {
      .login-button {
        transition: none;
      }
      
      .login-button:hover:not(:disabled) {
        transform: none;
      }
    }
  `]
})
export class LoginComponent {
  protected hidePassword = true;
  protected isLoading = signal(false);
  
  protected readonly loginForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  togglePasswordVisibility() {
    this.hidePassword = !this.hidePassword;
  }

  onSubmit() {
    if (this.loginForm.valid && !this.isLoading()) {
      this.isLoading.set(true);
      
      const loginData: LoginRequest = this.loginForm.value;
      
      this.authService.login(loginData).subscribe({
        next: (response) => {
          this.isLoading.set(false);
          this.snackBar.open('Login successful! Welcome back.', 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.router.navigate(['/todos']);
        },
        error: (error) => {
          this.isLoading.set(false);
          const errorMessage = error.error?.message || 'Login failed. Please try again.';
          this.snackBar.open(errorMessage, 'Close', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        }
      });
    }
  }
}