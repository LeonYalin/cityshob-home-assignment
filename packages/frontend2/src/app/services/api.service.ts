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
  type ToggleTodoResponse
} from '@real-time-todo/common';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly baseUrl = 'http://localhost:4000/api';

  constructor(private http: HttpClient) {}

  getHealth(): Observable<HealthResponse> {
    return this.http.get<HealthResponse>(`${this.baseUrl}/health`);
  }

  // Todo API methods
  getAllTodos(): Observable<Todo[]> {
    return this.http.get<GetTodosResponse>(`${this.baseUrl}/todos`)
      .pipe(map(response => response.data));
  }

  getTodoById(id: string): Observable<Todo> {
    return this.http.get<GetTodoResponse>(`${this.baseUrl}/todos/${id}`)
      .pipe(map(response => response.data));
  }

  createTodo(todo: CreateTodoRequest): Observable<Todo> {
    return this.http.post<CreateTodoResponse>(`${this.baseUrl}/todos`, todo)
      .pipe(map(response => response.data));
  }

  updateTodo(id: string, updates: UpdateTodoRequest): Observable<Todo> {
    return this.http.put<UpdateTodoResponse>(`${this.baseUrl}/todos/${id}`, updates)
      .pipe(map(response => response.data));
  }

  deleteTodo(id: string): Observable<void> {
    return this.http.delete<DeleteTodoResponse>(`${this.baseUrl}/todos/${id}`)
      .pipe(map(() => undefined));
  }

  toggleTodo(id: string): Observable<Todo> {
    return this.http.patch<ToggleTodoResponse>(`${this.baseUrl}/todos/${id}/toggle`, {})
      .pipe(map(response => response.data));
  }
}