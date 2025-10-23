import { Component, signal, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApiService, HealthResponse, HelloResponse } from './services/api.service';

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
  protected readonly helloData = signal<HelloResponse | null>(null);
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

    // Test hello endpoint
    this.apiService.getHello().subscribe({
      next: (data) => {
        this.helloData.set(data);
        console.log('Hello endpoint successful:', data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(`Hello endpoint failed: ${err.message}`);
        console.error('Hello endpoint error:', err);
        this.isLoading.set(false);
      }
    });
  }

  retryConnection() {
    this.testApiConnection();
  }
}
