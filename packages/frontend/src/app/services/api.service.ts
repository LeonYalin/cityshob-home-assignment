import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface HealthResponse {
  status: string;
  service: string;
  environment: string;
  timestamp: string;
  uptime: number;
}

export interface HelloResponse {
  message: string;
  timestamp: string;
  version: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly baseUrl = 'http://localhost:4000/api';

  constructor(private http: HttpClient) {}

  getHealth(): Observable<HealthResponse> {
    return this.http.get<HealthResponse>(`${this.baseUrl}/health`);
  }

  getHello(): Observable<HelloResponse> {
    return this.http.get<HelloResponse>(`${this.baseUrl}/hello`);
  }
}