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
import { AuthService } from '../services/auth.service';
import { type RegisterRequest } from '@real-time-todo/common';

@Component({
  selector: 'app-register',
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
    <div class="register-container">
      <div class="register-wrapper">
        <!-- App Header -->
        <div class="app-header">
          <h1 class="app-title">📝 Todo Manager</h1>
          <p class="app-subtitle">Join thousands of organized users</p>
        </div>

        <mat-card class="register-card">
          <mat-card-header>
            <div class="header-content">
              <mat-card-title>Create Account</mat-card-title>
              <mat-card-subtitle>Start organizing your tasks today</mat-card-subtitle>
            </div>
          </mat-card-header>

          <mat-card-content>
            <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
              <div class="form-fields">
                <!-- Username Field -->
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Username</mat-label>
                  <input 
                    matInput 
                    formControlName="username" 
                    placeholder="Choose a username"
                    autocomplete="username"
                  >
                  <mat-icon matSuffix color="primary">person</mat-icon>
                  <mat-hint align="end">{{ registerForm.get('username')?.value?.length || 0 }}/20</mat-hint>
                  <mat-error *ngIf="registerForm.get('username')?.hasError('required')">
                    Username is required
                  </mat-error>
                  <mat-error *ngIf="registerForm.get('username')?.hasError('minlength')">
                    Username must be at least 3 characters long
                  </mat-error>
                  <mat-error *ngIf="registerForm.get('username')?.hasError('maxlength')">
                    Username cannot exceed 20 characters
                  </mat-error>
                  <mat-error *ngIf="registerForm.get('username')?.hasError('pattern')">
                    Username can only contain letters, numbers, and underscores
                  </mat-error>
                </mat-form-field>

                <!-- Email Field -->
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Email</mat-label>
                  <input 
                    matInput 
                    type="email"
                    formControlName="email" 
                    placeholder="Enter your email address"
                    autocomplete="email"
                  >
                  <mat-icon matSuffix color="primary">email</mat-icon>
                  <mat-error *ngIf="registerForm.get('email')?.hasError('required')">
                    Email is required
                  </mat-error>
                  <mat-error *ngIf="registerForm.get('email')?.hasError('email')">
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
                    placeholder="Create a strong password"
                    autocomplete="new-password"
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
                  <mat-hint>Password must be at least 6 characters long</mat-hint>
                  <mat-error *ngIf="registerForm.get('password')?.hasError('required')">
                    Password is required
                  </mat-error>
                  <mat-error *ngIf="registerForm.get('password')?.hasError('minlength')">
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
                [disabled]="registerForm.invalid || isLoading()"
                (click)="onSubmit()"
                class="register-button"
              >
                @if (isLoading()) {
                  <ng-container>
                    <mat-spinner diameter="20"></mat-spinner>
                    <span>Creating Account...</span>
                  </ng-container>
                } @else {
                  <ng-container>
                    <mat-icon>person_add</mat-icon>
                    <span>Create Account</span>
                  </ng-container>
                }
              </button>
              
              <div class="login-link">
                <span>Already have an account?</span>
                <a routerLink="/login" mat-button color="accent">
                  Sign In
                </a>
              </div>
            </div>
          </mat-card-actions>
        </mat-card>

        <!-- Benefits Preview -->
        <div class="benefits-preview">
          <div class="benefit-item">
            <mat-icon color="primary">cloud_sync</mat-icon>
            <span>Cloud sync</span>
          </div>
          <div class="benefit-item">
            <mat-icon color="primary">groups</mat-icon>
            <span>Team sharing</span>
          </div>
          <div class="benefit-item">
            <mat-icon color="primary">security</mat-icon>
            <span>Secure & private</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .register-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      position: relative;
    }

    .register-wrapper {
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

    .register-card {
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

    .register-button {
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

    .register-button mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      vertical-align: text-bottom;
      margin-right: 4px;
    }

    .register-button span {
      display: flex;
      align-items: center;
      line-height: 1;
    }

    .register-button:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
    }

    .register-button:disabled {
      opacity: 0.7;
      cursor: not-allowed;
      transform: none;
    }

    .register-button mat-spinner {
      margin-right: 8px;
    }

    .login-link {
      text-align: center;
      display: flex;
      flex-direction: column;
      gap: 8px;
      color: #718096;
    }

    .login-link span {
      font-size: 14px;
    }

    .login-link a {
      font-weight: 500;
      text-decoration: none;
    }

    .benefits-preview {
      display: flex;
      justify-content: space-around;
      gap: 16px;
      margin-top: 16px;
    }

    .benefit-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      color: white;
      opacity: 0.9;
      text-align: center;
    }

    .benefit-item mat-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
    }

    .benefit-item span {
      font-size: 12px;
      font-weight: 400;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .register-container {
        padding: 16px;
      }

      .app-title {
        font-size: 2rem;
      }

      .app-subtitle {
        font-size: 1rem;
      }

      .register-wrapper {
        max-width: 400px;
      }

      .benefits-preview {
        flex-direction: column;
        gap: 12px;
      }

      .benefit-item {
        flex-direction: row;
        justify-content: center;
        gap: 12px;
      }

      .benefit-item span {
        font-size: 14px;
      }
    }

    @media (max-width: 480px) {
      .register-container {
        padding: 12px;
      }

      .app-title {
        font-size: 1.75rem;
      }

      .register-wrapper {
        max-width: 100%;
      }

      .register-card {
        border-radius: 12px;
      }

      .form-fields {
        gap: 16px;
      }

      .register-button {
        height: 44px;
        font-size: 15px;
      }
    }

    /* Loading State */
    .register-button mat-spinner {
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
      .register-button {
        transition: none;
      }
      
      .register-button:hover:not(:disabled) {
        transform: none;
      }
    }
  `]
})
export class RegisterComponent {
  protected hidePassword = true;
  protected isLoading = signal(false);
  
  protected readonly registerForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.registerForm = this.fb.group({
      username: ['', [
        Validators.required, 
        Validators.minLength(3), 
        Validators.maxLength(20),
        Validators.pattern(/^[a-zA-Z0-9_]+$/)
      ]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  togglePasswordVisibility() {
    this.hidePassword = !this.hidePassword;
  }

  onSubmit() {
    if (this.registerForm.valid && !this.isLoading()) {
      this.isLoading.set(true);
      
      const registerData: RegisterRequest = this.registerForm.value;
      
      this.authService.register(registerData).subscribe({
          next: (response) => {
            this.isLoading.set(false);
            this.snackBar.open('Account created successfully! Welcome to Todo Manager.', 'Close', {
              duration: 4000,
              panelClass: ['success-snackbar']
            });
            this.router.navigate(['/todos']);
          },
          error: (error: { error?: { errors?: Array<{ message: string }>; message?: string } }) => {
            this.isLoading.set(false);
            let errorMessage = 'Registration failed. Please try again.';
            
            if (error.error?.errors && Array.isArray(error.error.errors)) {
              errorMessage = error.error.errors.map((e) => e.message).join(', ');
            } else if (error.error?.message) {
              errorMessage = error.error.message;
            }
            
            this.snackBar.open(errorMessage, 'Close', {
              duration: 5000,
              panelClass: ['error-snackbar']
            });
          }
        });
    }
  }
}
