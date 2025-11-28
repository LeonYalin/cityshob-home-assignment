import { Component, signal, inject, OnInit, OnDestroy, computed } from '@angular/core';
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
import { WebSocketService } from '../services/websocket.service';
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
      <!-- Floating Users Menu -->
      <div class="users-menu" [class.expanded]="usersMenuExpanded()">
        <button 
          mat-fab 
          color="primary" 
          class="users-toggle"
          (click)="toggleUsersMenu()"
          [matBadge]="connectedUsersCount()"
          matBadgeColor="accent"
          matTooltip="Connected Users"
        >
          <mat-icon>people</mat-icon>
        </button>
        
        @if (usersMenuExpanded()) {
          <div class="users-list-container">
            <div class="users-header">
              <h3>Online Users ({{ connectedUsersCount() }})</h3>
              <div class="connection-status">
                @if (isWebSocketConnected()) {
                  <span class="status-indicator connected" matTooltip="Connected">
                    <mat-icon>wifi</mat-icon>
                  </span>
                } @else {
                  <span class="status-indicator disconnected" matTooltip="Disconnected">
                    <mat-icon>wifi_off</mat-icon>
                  </span>
                }
                <button mat-icon-button (click)="toggleUsersMenu()">
                  <mat-icon>close</mat-icon>
                </button>
              </div>
            </div>
            
            <mat-divider></mat-divider>
            
            <div class="users-list">
              @if (connectedUsersCount() === 0) {
                <div class="no-users">
                  <mat-icon>person_off</mat-icon>
                  @if (isWebSocketConnected()) {
                    <p>No other users online</p>
                    <small>Just you right now</small>
                  } @else {
                    <p>Not connected to server</p>
                    <button mat-raised-button color="primary" (click)="reconnectWebSocket()">
                      <mat-icon>refresh</mat-icon>
                      Reconnect
                    </button>
                  }
                </div>
              } @else {
                @for (user of connectedUsers(); track user.userId) {
                  <div 
                    class="user-item"
                    [class.current-user]="isCurrentUser(user.userId)"
                  >
                    <div class="user-avatar">
                      <mat-icon>{{ isCurrentUser(user.userId) ? 'person' : 'account_circle' }}</mat-icon>
                    </div>
                    <div class="user-info">
                      <span class="user-name">
                        {{ user.username }}
                        @if (isCurrentUser(user.userId)) {
                          <span class="you-badge">(You)</span>
                        }
                      </span>
                      <span class="user-status">
                        <span class="online-dot"></span>
                        Online
                      </span>
                    </div>
                  </div>
                }
              }
            </div>
          </div>
        }
      </div>

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
              [class.locked]="!!todo.lockedBy && !isCurrentUser(todo.lockedBy)"
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
                    <div class="chips-row">
                      <mat-chip 
                        [class]="'priority-' + todo.priority"
                        class="priority-chip"
                      >
                        {{ todo.priority | titlecase }}
                      </mat-chip>
                      @if (todo.lockedBy && !isCurrentUser(todo.lockedBy)) {
                        <mat-chip class="lock-chip" matTooltip="Locked by {{ getUsernameById(todo.lockedBy) }}">
                          <mat-icon class="lock-icon">lock</mat-icon>
                          Locked by {{ getUsernameById(todo.lockedBy) }}
                        </mat-chip>
                      }
                    </div>
                  </div>

                  <div class="todo-actions">
                    <button
                      mat-icon-button
                      color="primary"
                      (click)="editTodo(todo)"
                      [disabled]="todo.completed || (todo.lockedBy && !isCurrentUser(todo.lockedBy))"
                      [matTooltip]="getTodoEditTooltip(todo)"
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

    /* Floating Users Menu */
    .users-menu {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 1000;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 12px;
    }

    .users-toggle {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      transition: all 0.3s ease;
    }

    .users-toggle:hover {
      transform: scale(1.05);
    }

    .users-list-container {
      background: white;
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
      width: 320px;
      max-height: 500px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      animation: slideInUp 0.3s ease-out;
    }

    @keyframes slideInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .users-header {
      padding: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .users-header h3 {
      margin: 0;
      font-size: 1.1rem;
      font-weight: 500;
    }

    .connection-status {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .status-indicator {
      display: flex;
      align-items: center;
      font-size: 0.85rem;
    }

    .status-indicator mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .status-indicator.connected {
      color: #4caf50;
    }

    .status-indicator.disconnected {
      color: #f44336;
    }

    .users-list {
      overflow-y: auto;
      max-height: 400px;
      padding: 8px;
    }

    .no-users {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
      color: #999;
      gap: 12px;
    }

    .no-users mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
    }

    .user-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      border-radius: 8px;
      margin-bottom: 4px;
      transition: all 0.2s ease;
      cursor: pointer;
    }

    .user-item:hover {
      background-color: #f5f5f5;
    }

    .user-item.current-user {
      background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
      border: 2px solid #2196f3;
    }

    .user-item.current-user:hover {
      background: linear-gradient(135deg, #bbdefb 0%, #90caf9 100%);
    }

    .user-avatar {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .user-item.current-user .user-avatar {
      background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
    }

    .user-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .user-name {
      font-weight: 500;
      font-size: 0.95rem;
      color: #333;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .you-badge {
      display: inline-block;
      background: #2196f3;
      color: white;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 0.7rem;
      font-weight: 600;
    }

    .user-status {
      font-size: 0.8rem;
      color: #666;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .online-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: #4caf50;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.5;
      }
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

    .todo-card.locked {
      border: 2px solid #ffa726;
      background: linear-gradient(135deg, #fff9e6 0%, #ffe8cc 100%);
      box-shadow: 0 4px 12px rgba(255, 167, 38, 0.3);
      position: relative;
    }

    .todo-card.locked::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #ffa726 0%, #ff9800 100%);
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

    .chips-row {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
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

    .lock-chip {
      background: linear-gradient(135deg, #ffa726 0%, #ff9800 100%);
      color: white;
      font-size: 0.75rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 4px;
      box-shadow: 0 2px 4px rgba(255, 167, 38, 0.3);
    }

    .lock-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
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

      .users-menu {
        bottom: 16px;
        right: 16px;
      }

      .users-list-container {
        width: calc(100vw - 32px);
        max-width: 320px;
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
export class TodoListComponent implements OnInit, OnDestroy {
  // State management with signals
  protected readonly todos = signal<Todo[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly usersMenuExpanded = signal(false);

  // Connected users from WebSocket
  protected readonly connectedUsers = computed(() => this.webSocketService.connectedUsers());
  protected readonly connectedUsersCount = computed(() => this.connectedUsers().length);
  protected readonly isWebSocketConnected = computed(() => this.webSocketService.isConnected());

  // Current user ID for comparison
  protected readonly currentUserId = computed(() => this.authService.currentUser()?.id || '');

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
  private readonly webSocketService = inject(WebSocketService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);

  ngOnInit() {
    this.loadTodos();
    this.setupWebSocket();
  }

  ngOnDestroy() {
    this.webSocketService.clearCallbacks();
    this.webSocketService.disconnect();
  }

  private setupWebSocket() {
    // Connect to WebSocket
    this.webSocketService.connect();

    // Setup event handlers
    this.webSocketService.onTodoCreated((event) => {
      // Reload to get the new todo if we don't have it
      this.apiService.getTodoById(event.todo.id).subscribe({
        next: (todo) => {
          this.todos.update(todos => {
            // Avoid duplicates
            if (todos.some(t => t.id === todo.id)) {
              return todos;
            }
            return [todo, ...todos];
          });
        },
        error: (err) => console.error('Failed to load new todo:', err)
      });
    });

    this.webSocketService.onTodoUpdated((event) => {
      this.apiService.getTodoById(event.todo.id).subscribe({
        next: (todo) => {
          this.todos.update(todos => 
            todos.map(t => t.id === todo.id ? todo : t)
          );
        },
        error: (err) => console.error('Failed to load updated todo:', err)
      });
    });

    this.webSocketService.onTodoDeleted((event) => {
      this.todos.update(todos => todos.filter(t => t.id !== event.todoId));
    });

    this.webSocketService.onTodoLocked((event) => {
      this.todos.update(todos => 
        todos.map(t => t.id === event.todoId 
          ? { ...t, lockedBy: event.userId, lockedAt: event.lockedAt }
          : t
        )
      );
    });

    this.webSocketService.onTodoUnlocked((event) => {
      this.todos.update(todos => 
        todos.map(t => t.id === event.todoId 
          ? { ...t, lockedBy: undefined, lockedAt: undefined }
          : t
        )
      );
    });
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
    // Check if todo is locked by someone else
    if (todo.lockedBy && !this.isCurrentUser(todo.lockedBy)) {
      const lockedByUsername = this.getUsernameById(todo.lockedBy);
      this.showSnackBar(`This todo is currently being edited by ${lockedByUsername}`, 'warning');
      return;
    }

    // Lock the todo before opening dialog
    this.apiService.lockTodo(todo.id).subscribe({
      next: (lockResponse) => {
        // Open dialog after successfully locking
        const dialogRef = this.dialog.open(TodoDialogComponent, {
          width: '500px',
          maxWidth: '90vw',
          position: { top: '10vh' },
          disableClose: false,
          data: { mode: 'edit', todo }
        });

        dialogRef.afterClosed().subscribe(result => {
          // Always unlock when dialog closes (whether saved or cancelled)
          this.apiService.unlockTodo(todo.id).subscribe({
            next: () => {
              if (result) {
                this.updateTodo(todo.id, result);
              }
            },
            error: (err) => {
              console.error('Failed to unlock todo:', err);
              // Still update if user saved changes
              if (result) {
                this.updateTodo(todo.id, result);
              }
            }
          });
        });
      },
      error: (err) => {
        // Show error if locking failed (e.g., already locked)
        const errorMsg = err.error?.message || 'Failed to lock todo';
        this.showSnackBar(errorMsg, 'error');
        console.error('Lock todo error:', err);
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

  toggleUsersMenu() {
    this.usersMenuExpanded.update(v => !v);
  }

  isCurrentUser(userId: string): boolean {
    return userId === this.currentUserId();
  }

  getUsernameById(userId: string): string {
    const user = this.connectedUsers().find(u => u.userId === userId);
    return user?.username || 'Unknown User';
  }

  getTodoEditTooltip(todo: Todo): string {
    if (todo.completed) {
      return 'Cannot edit completed todo';
    }
    if (todo.lockedBy && !this.isCurrentUser(todo.lockedBy)) {
      const lockedByUsername = this.getUsernameById(todo.lockedBy);
      return `Locked by ${lockedByUsername}`;
    }
    return 'Edit Todo';
  }

  reconnectWebSocket() {
    console.log('Manually reconnecting WebSocket...');
    this.webSocketService.disconnect();
    setTimeout(() => {
      this.webSocketService.connect();
    }, 500);
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

  private showSnackBar(message: string, type: 'success' | 'error' | 'warning') {
    let panelClass: string;
    switch (type) {
      case 'success':
        panelClass = 'success-snackbar';
        break;
      case 'warning':
        panelClass = 'warning-snackbar';
        break;
      default:
        panelClass = 'error-snackbar';
    }
    
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: panelClass
    });
  }
}