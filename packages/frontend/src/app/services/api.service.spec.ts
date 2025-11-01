import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ApiService, Todo, TodoInput } from './api.service';

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
    updatedAt: '2025-11-01T10:00:00Z'
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
    const mockTodos = [mockTodo];

    service.getAllTodos().subscribe(todos => {
      expect(todos).toEqual(mockTodos);
    });

    const req = httpMock.expectOne('http://localhost:4000/api/todos');
    expect(req.request.method).toBe('GET');
    req.flush(mockTodos);
  });

  it('should create a todo', () => {
    const todoInput: TodoInput = {
      title: 'New Todo',
      description: 'New Description',
      priority: 'high'
    };

    service.createTodo(todoInput).subscribe(todo => {
      expect(todo.title).toBe(todoInput.title);
    });

    const req = httpMock.expectOne('http://localhost:4000/api/todos');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(todoInput);
    req.flush({ ...mockTodo, ...todoInput });
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
      expect(health).toEqual(mockHealth);
    });

    const req = httpMock.expectOne('http://localhost:4000/api/health');
    expect(req.request.method).toBe('GET');
    req.flush(mockHealth);
  });
});