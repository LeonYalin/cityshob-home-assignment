import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { type Todo, type CreateTodoRequest, type UpdateTodoRequest } from '@real-time-todo/common';

import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { TodoDialogComponent } from './todo-dialog.component';

@Component({
  selector: 'app-todo-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatToolbarModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
    MatSelectModule,
    MatChipsModule,
    MatSnackBarModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatBadgeModule,
    MatTooltipModule
  ],
  template: `
    <div class="todo-container">
      <!-- Header with Actions -->
      <mat-toolbar color="primary" class="toolbar">
        <span class="title">📝 Todo Manager</span>
        <span class="spacer"></span>
        <button 
          mat-raised-button 
          color="accent" 
          (click)="openCreateDialog()"
          class="add-button"
        >
          <mat-icon>add</mat-icon>
          Add Todo
        </button>
        <button 
          mat-icon-button
          (click)="logout()"
          class="logout-button"
          matTooltip="Logout"
        >
          <mat-icon>logout</mat-icon>
        </button>
      </mat-toolbar>

      <!-- Statistics Cards -->
      <div class="stats-row">
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <mat-icon color="primary">checklist</mat-icon>
              <div class="stat-numbers">
                <span class="stat-value">{{ totalTodos() }}</span>
                <span class="stat-label">Total</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <mat-icon color="accent">pending_actions</mat-icon>
              <div class="stat-numbers">
                <span class="stat-value">{{ pendingTodos() }}</span>
                <span class="stat-label">Pending</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <mat-icon color="primary">task_alt</mat-icon>
              <div class="stat-numbers">
                <span class="stat-value">{{ completedTodos() }}</span>
                <span class="stat-label">Completed</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Loading State -->
      @if (isLoading()) {
        <div class="loading-container">
          <mat-spinner diameter="50"></mat-spinner>
          <p>Loading todos...</p>
        </div>
      }

      <!-- Error State -->
      @if (error()) {
        <mat-card class="error-card">
          <mat-card-content>
            <div class="error-content">
              <mat-icon color="warn">error</mat-icon>
              <div>
                <h3>Error Loading Todos</h3>
                <p>{{ error() }}</p>
                <button mat-raised-button color="primary" (click)="loadTodos()">
                  Retry
                </button>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      }

      <!-- Todo List -->
      @if (todos().length > 0 && !isLoading()) {
        <div class="todos-grid">
          @for (todo of todos(); track todo.id) {
            <mat-card 
              class="todo-card"
              [class.completed]="todo.completed"
              [class.high-priority]="todo.priority === 'high'"
              [class.medium-priority]="todo.priority === 'medium'"
              [class.low-priority]="todo.priority === 'low'"
            >
              <mat-card-header>
                <div class="todo-header">
                  <mat-checkbox
                    [checked]="todo.completed"
                    (change)="toggleComplete(todo)"
                    color="primary"
                  ></mat-checkbox>
                  
                  <div class="todo-title-section">
                    <h3 [class.completed-text]="todo.completed">{{ todo.title }}</h3>
                    <mat-chip 
                      [class]="'priority-' + todo.priority"
                      class="priority-chip"
                    >
                      {{ todo.priority | titlecase }}
                    </mat-chip>
                  </div>

                  <div class="todo-actions">
                    <button
                      mat-icon-button
                      color="primary"
                      (click)="editTodo(todo)"
                      [disabled]="todo.completed"
                      matTooltip="Edit Todo"
                    >
                      <mat-icon>edit</mat-icon>
                    </button>
                    <button
                      mat-icon-button
                      color="warn"
                      (click)="deleteTodo(todo)"
                      matTooltip="Delete Todo"
                    >
                      <mat-icon>delete</mat-icon>
                    </button>
                  </div>
                </div>
              </mat-card-header>

              @if (todo.description) {
                <mat-card-content>
                  <p [class.completed-text]="todo.completed">{{ todo.description }}</p>
                </mat-card-content>
              }

              <mat-card-actions class="timestamp-section">
                <div class="timestamps">
                  <small class="timestamp">
                    Created: {{ formatDate(todo.createdAt) }}
                  </small>
                  @if (todo.updatedAt !== todo.createdAt) {
                    <small class="timestamp">
                      Updated: {{ formatDate(todo.updatedAt) }}
                    </small>
                  }
                </div>
              </mat-card-actions>
            </mat-card>
          }
        </div>
      }

      <!-- Empty State -->
      @if (todos().length === 0 && !isLoading() && !error()) {
        <mat-card class="empty-state">
          <mat-card-content>
            <div class="empty-content">
              <mat-icon class="empty-icon">assignment</mat-icon>
              <h2>No Todos Yet</h2>
              <p>Create your first todo to get started!</p>
              <button mat-raised-button color="primary" (click)="openCreateDialog()">
                <mat-icon>add</mat-icon>
                Create Todo
              </button>
            </div>
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .todo-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }

    .toolbar {
      border-radius: 8px;
      margin-bottom: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .title {
      font-size: 1.5rem;
      font-weight: 500;
    }

    .spacer {
      flex: 1 1 auto;
    }

    .add-button {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .logout-button {
      margin-left: 8px;
    }

    .stats-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .stat-card {
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    }

    .stat-content {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .stat-numbers {
      display: flex;
      flex-direction: column;
    }

    .stat-value {
      font-size: 2rem;
      font-weight: bold;
      color: #333;
    }

    .stat-label {
      font-size: 0.875rem;
      color: #666;
      text-transform: uppercase;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 40px;
      gap: 16px;
    }

    .error-card {
      margin-bottom: 20px;
      border-left: 4px solid #f44336;
    }

    .error-content {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .todos-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 20px;
    }

    .todo-card {
      transition: all 0.3s ease;
      border-radius: 12px;
      overflow: hidden;
    }

    .todo-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }

    .todo-card.completed {
      opacity: 0.7;
      background-color: #f5f5f5;
    }

    .todo-card.high-priority {
      border-left: 4px solid #f44336;
    }

    .todo-card.medium-priority {
      border-left: 4px solid #ff9800;
    }

    .todo-card.low-priority {
      border-left: 4px solid #4caf50;
    }

    .todo-header {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      width: 100%;
    }

    .todo-title-section {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .todo-title-section h3 {
      margin: 0;
      font-size: 1.1rem;
      line-height: 1.3;
    }

    .completed-text {
      text-decoration: line-through;
      color: #999;
    }

    .priority-chip {
      width: fit-content;
      font-size: 0.75rem;
    }

    .priority-chip.priority-high {
      background-color: #ffebee;
      color: #c62828;
    }

    .priority-chip.priority-medium {
      background-color: #fff3e0;
      color: #ef6c00;
    }

    .priority-chip.priority-low {
      background-color: #e8f5e8;
      color: #2e7d32;
    }

    .todo-actions {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .timestamp-section {
      padding: 8px 16px 16px 16px !important;
      justify-content: flex-start !important;
    }

    .timestamps {
      display: flex;
      flex-direction: column;
      gap: 4px;
      width: 100%;
    }

    .timestamp {
      color: #666;
      font-size: 0.75rem;
      line-height: 1.2;
    }

    .empty-state {
      text-align: center;
      padding: 40px;
      margin-top: 40px;
    }

    .empty-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
    }

    .empty-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #ccc;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .todo-container {
        padding: 10px;
      }

      .stats-row {
        grid-template-columns: 1fr;
        gap: 12px;
      }

      .todos-grid {
        grid-template-columns: 1fr;
        gap: 16px;
      }

      .todo-header {
        flex-direction: column;
        gap: 8px;
      }

      .todo-actions {
        flex-direction: row;
        justify-content: flex-end;
      }
    }
  `]
})
export class TodoListComponent implements OnInit {
  // State management with signals
  protected readonly todos = signal<Todo[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly error = signal<string | null>(null);

  // Computed values
  protected readonly totalTodos = computed(() => this.todos().length);
  protected readonly completedTodos = computed(() => 
    this.todos().filter(todo => todo.completed).length
  );
  protected readonly pendingTodos = computed(() => 
    this.todos().filter(todo => !todo.completed).length
  );

  // Injected services
  private readonly apiService = inject(ApiService);
  private readonly authService = inject(AuthService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);

  ngOnInit() {
    this.loadTodos();
  }

  loadTodos() {
    this.isLoading.set(true);
    this.error.set(null);

    this.apiService.getAllTodos().subscribe({
      next: (todos) => {
        this.todos.set(todos);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(err.message || 'Failed to load todos');
        this.isLoading.set(false);
        this.showSnackBar('Failed to load todos', 'error');
      }
    });
  }

  openCreateDialog() {
    const dialogRef = this.dialog.open(TodoDialogComponent, {
      width: '500px',
      maxWidth: '90vw',
      position: { top: '10vh' },
      disableClose: false,
      data: { mode: 'create' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.createTodo(result);
      }
    });
  }

  createTodo(todoData: CreateTodoRequest) {
    this.apiService.createTodo(todoData).subscribe({
      next: (newTodo) => {
        this.todos.update(todos => [newTodo, ...todos]);
        this.showSnackBar('Todo created successfully', 'success');
      },
      error: (err) => {
        this.showSnackBar('Failed to create todo', 'error');
        console.error('Create todo error:', err);
      }
    });
  }

  editTodo(todo: Todo) {
    const dialogRef = this.dialog.open(TodoDialogComponent, {
      width: '500px',
      maxWidth: '90vw',
      position: { top: '10vh' },
      disableClose: false,
      data: { mode: 'edit', todo }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.updateTodo(todo.id, result);
      }
    });
  }

  updateTodo(id: string, updateData: UpdateTodoRequest) {
    this.apiService.updateTodo(id, updateData).subscribe({
      next: (updatedTodo) => {
        this.todos.update(todos => 
          todos.map(todo => todo.id === id ? updatedTodo : todo)
        );
        this.showSnackBar('Todo updated successfully', 'success');
      },
      error: (err) => {
        this.showSnackBar('Failed to update todo', 'error');
        console.error('Update todo error:', err);
      }
    });
  }

  toggleComplete(todo: Todo) {
    const updateData: UpdateTodoRequest = { completed: !todo.completed };
    this.updateTodo(todo.id, updateData);
  }

  deleteTodo(todo: Todo) {
    if (confirm(`Are you sure you want to delete "${todo.title}"?`)) {
      this.apiService.deleteTodo(todo.id).subscribe({
        next: () => {
          this.todos.update(todos => todos.filter(t => t.id !== todo.id));
          this.showSnackBar('Todo deleted successfully', 'success');
        },
        error: (err) => {
          this.showSnackBar('Failed to delete todo', 'error');
          console.error('Delete todo error:', err);
        }
      });
    }
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        this.showSnackBar('Logged out successfully', 'success');
        this.router.navigate(['/login']);
      },
      error: () => {
        // Even on error, navigate to login
        this.router.navigate(['/login']);
      }
    });
  }

  private showSnackBar(message: string, type: 'success' | 'error') {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: type === 'success' ? 'success-snackbar' : 'error-snackbar'
    });
  }
}