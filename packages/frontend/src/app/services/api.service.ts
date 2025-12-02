import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { 
  type Todo, 
  type CreateTodoRequest, 
  type UpdateTodoRequest,
  type HealthResponse,
  type GetTodosResponse,
  type GetTodoResponse,
  type CreateTodoResponse,
  type UpdateTodoResponse,
  type DeleteTodoResponse,
  type ToggleTodoResponse,
  type LockTodoResponse,
  type UnlockTodoResponse
} from '@real-time-todo/common';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getHealth(): Observable<HealthResponse> {
    return this.http.get<HealthResponse>(`${this.baseUrl}/health`);
  }

  // Todo API methods
  getAllTodos(): Observable<Todo[]> {
    return this.http.get<GetTodosResponse>(`${this.baseUrl}/todos`)
      .pipe(map(response => response.data?.data || []));
  }

  getTodoById(id: string): Observable<Todo> {
    return this.http.get<GetTodoResponse>(`${this.baseUrl}/todos/${id}`)
      .pipe(map(response => response.data!));
  }

  createTodo(todo: CreateTodoRequest): Observable<Todo> {
    return this.http.post<CreateTodoResponse>(`${this.baseUrl}/todos`, todo)
      .pipe(map(response => response.data!));
  }

  updateTodo(id: string, updates: UpdateTodoRequest): Observable<Todo> {
    return this.http.put<UpdateTodoResponse>(`${this.baseUrl}/todos/${id}`, updates)
      .pipe(map(response => response.data!));
  }

  deleteTodo(id: string): Observable<void> {
    return this.http.delete<DeleteTodoResponse>(`${this.baseUrl}/todos/${id}`)
      .pipe(map(() => undefined));
  }

  toggleTodo(id: string): Observable<Todo> {
    return this.http.patch<ToggleTodoResponse>(`${this.baseUrl}/todos/${id}/toggle`, {})
      .pipe(map(response => response.data!));
  }

  lockTodo(id: string): Observable<{ id: string; lockedBy: string; lockedAt: string }> {
    return this.http.post<LockTodoResponse>(`${this.baseUrl}/todos/${id}/lock`, {})
      .pipe(map(response => response.data!));
  }

  unlockTodo(id: string): Observable<void> {
    return this.http.post<UnlockTodoResponse>(`${this.baseUrl}/todos/${id}/unlock`, {})
      .pipe(map(() => undefined));
  }
}