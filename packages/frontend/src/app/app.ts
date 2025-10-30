import { Component, signal, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApiService, HealthResponse, Todo } from './services/api.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected readonly title = signal('Real-Time Todo App');
  protected readonly isLoading = signal(false);
  protected readonly healthData = signal<HealthResponse | null>(null);
  protected readonly todos = signal<Todo[]>([]);
  protected readonly error = signal<string | null>(null);

  private readonly apiService = inject(ApiService);

  ngOnInit() {
    this.testApiConnection();
  }

  testApiConnection() {
    this.isLoading.set(true);
    this.error.set(null);

    // Test health endpoint
    this.apiService.getHealth().subscribe({
      next: (data) => {
        this.healthData.set(data);
        console.log('Health check successful:', data);
      },
      error: (err) => {
        this.error.set(`Health check failed: ${err.message}`);
        console.error('Health check error:', err);
      }
    });

    // Test todos endpoint
    this.apiService.getAllTodos().subscribe({
      next: (data) => {
        this.todos.set(data);
        console.log('Todos API successful:', data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(`Todos API failed: ${err.message}`);
        console.error('Todos API error:', err);
        this.isLoading.set(false);
      }
    });
  }

  retryConnection() {
    this.testApiConnection();
  }

  createTestTodo() {
    const testTodo = {
      title: 'Test Todo from Frontend',
      description: 'This is a test todo created from the Angular frontend',
      priority: 'high' as const
    };

    this.apiService.createTodo(testTodo).subscribe({
      next: (data) => {
        console.log('Todo created:', data);
        // Refresh the todos list
        this.testApiConnection();
      },
      error: (err) => {
        this.error.set(`Failed to create todo: ${err.message}`);
        console.error('Create todo error:', err);
      }
    });
  }

  toggleTodo(id: string) {
    this.apiService.toggleTodo(id).subscribe({
      next: (data) => {
        console.log('Todo toggled:', data);
        // Refresh the todos list
        this.testApiConnection();
      },
      error: (err) => {
        this.error.set(`Failed to toggle todo: ${err.message}`);
        console.error('Toggle todo error:', err);
      }
    });
  }

  deleteTodo(id: string) {
    this.apiService.deleteTodo(id).subscribe({
      next: () => {
        console.log('Todo deleted');
        // Refresh the todos list
        this.testApiConnection();
      },
      error: (err) => {
        this.error.set(`Failed to delete todo: ${err.message}`);
        console.error('Delete todo error:', err);
      }
    });
  }
}
