import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ApiService } from './api.service';
import { Todo, CreateTodoRequest } from '@real-time-todo/common';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;

  const mockTodo: Todo = {
    id: 'todo-123',
    title: 'Test Todo',
    description: 'Test Description',
    completed: false,
    priority: 'medium',
    createdAt: '2025-11-01T10:00:00Z',
    updatedAt: '2025-11-01T10:00:00Z',
    createdBy: 'user-123'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ApiService]
    });
    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get all todos', () => {
    const mockResponse = {
      success: true,
      message: 'Todos fetched',
      data: {
        data: [mockTodo],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1
      }
    };

    service.getAllTodos().subscribe(todos => {
      expect(todos.length).toBe(1);
      expect(todos[0]).toEqual(mockTodo);
    });

    const req = httpMock.expectOne('http://localhost:9876/api/todos');
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should create a todo', () => {
    const todoInput: CreateTodoRequest = {
      title: 'New Todo',
      description: 'New Description',
      priority: 'high'
    };
    
    const mockResponse = {
      success: true,
      message: 'Todo created',
      data: { ...mockTodo, ...todoInput }
    };

    service.createTodo(todoInput).subscribe(todo => {
      expect(todo.title).toBe(todoInput.title);
    });

    const req = httpMock.expectOne('http://localhost:9876/api/todos');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(todoInput);
    req.flush(mockResponse);
  });

  it('should get health status', () => {
    const mockHealth = {
      status: 'OK',
      service: 'Real-Time Todo API',
      environment: 'development',
      timestamp: '2025-11-01T10:00:00Z',
      uptime: 12345
    };

    service.getHealth().subscribe(health => {
      expect(health.status).toBe('OK');
    });

    const req = httpMock.expectOne('http://localhost:9876/api/health');
    expect(req.request.method).toBe('GET');
    req.flush(mockHealth);
  });
});
