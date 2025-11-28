import { ITodoRepository } from '../../repositories/interfaces/todo-repository.interface';
import { TodoDoc } from '../../models/todo.model';
import { CreateTodoInput, UpdateTodoInput, TodoQueryParams } from '../../schemas/todo.schema';
import type { Priority } from '@real-time-todo/common';

// Simplified Todo type for testing (without Mongoose Document methods)
interface SimpleTodo {
  id: string;
  _id?: string;
  title: string;
  description: string;
  completed: boolean;
  priority: Priority;
  createdAt: Date;
  updatedAt: Date;
  isLocked: boolean;
  lockedBy?: string;
  lockedAt?: Date;
}

/**
 * Test double that implements ITodoRepository for testing
 * Better than mocking because it provides real implementation behavior
 */
export class FakeTodoRepository implements ITodoRepository {
  private todos: Map<string, SimpleTodo> = new Map();
  private lockedTodos: Map<string, { userId?: string; lockedAt: Date }> = new Map();
  private nextId = 1;

  async create(todoData: CreateTodoInput): Promise<TodoDoc> {
    this.checkError();
    this.recordOperation('create', todoData);
    const newTodo: SimpleTodo = {
      id: this.nextId.toString(),
      _id: this.nextId.toString(),
      title: todoData.title,
      description: todoData.description,
      completed: false,
      priority: todoData.priority || 'medium',
      createdAt: new Date(),
      updatedAt: new Date(),
      isLocked: false,
    };
    this.nextId++;
    this.todos.set(newTodo.id, newTodo);
    return newTodo as TodoDoc;
  }

  async findById(id: string): Promise<TodoDoc | null> {
    this.checkError();
    this.recordOperation('findById', { id });
    const todo = this.todos.get(id);
    return todo ? (todo as TodoDoc) : null;
  }

  async findAll(queryParams?: TodoQueryParams): Promise<TodoDoc[]> {
    this.checkError();
    this.recordOperation('findAll', queryParams);
    let todos = Array.from(this.todos.values());
    
    if (queryParams?.completed !== undefined) {
      todos = todos.filter(todo => todo.completed === queryParams.completed);
    }
    if (queryParams?.priority) {
      todos = todos.filter(todo => todo.priority === queryParams.priority);
    }
    
    return todos as TodoDoc[];
  }

  async update(id: string, updateData: UpdateTodoInput): Promise<TodoDoc | null> {
    this.checkError();
    this.recordOperation('update', { id, updateData });
    const existing = this.todos.get(id);
    if (!existing) return null;

    const updated: SimpleTodo = {
      ...existing,
      ...updateData,
      id: existing.id, // Prevent ID changes
      updatedAt: new Date(),
    };
    this.todos.set(id, updated);
    return updated as TodoDoc;
  }

  async delete(id: string): Promise<boolean> {
    this.checkError();
    this.recordOperation('delete', { id });
    const deleted = this.todos.delete(id);
    this.lockedTodos.delete(id); // Clean up lock
    return deleted;
  }

  async toggleCompletion(id: string): Promise<TodoDoc | null> {
    this.checkError();
    const todo = this.todos.get(id);
    if (!todo) return null;

    const updated: SimpleTodo = {
      ...todo,
      completed: !todo.completed,
      updatedAt: new Date(),
    };
    this.todos.set(id, updated);
    return updated as TodoDoc;
  }

  async findByIdAndLock(id: string, userId?: string): Promise<TodoDoc | null> {
    this.checkError();
    const todo = this.todos.get(id);
    if (!todo) return null;

    // Check if already locked
    const lockInfo = this.lockedTodos.get(id);
    if (lockInfo && lockInfo.userId !== userId) {
      return null; // Already locked by someone else
    }

    // Lock the todo
    this.lockedTodos.set(id, { userId, lockedAt: new Date() });
    const lockedTodo: SimpleTodo = {
      ...todo,
      isLocked: true,
      lockedBy: userId,
      lockedAt: new Date(),
    };
    this.todos.set(id, lockedTodo);
    return lockedTodo as TodoDoc;
  }

  async unlock(id: string): Promise<void> {
    this.checkError();
    this.lockedTodos.delete(id);
    const todo = this.todos.get(id);
    if (todo) {
      const unlockedTodo: SimpleTodo = {
        ...todo,
        isLocked: false,
        lockedBy: undefined,
        lockedAt: undefined,
      };
      this.todos.set(id, unlockedTodo);
    }
  }

  async isLocked(id: string): Promise<boolean> {
    this.checkError();
    return this.lockedTodos.has(id);
  }

  async findByStatus(completed: boolean, queryParams?: TodoQueryParams): Promise<TodoDoc[]> {
    this.checkError();
    const filtered = Array.from(this.todos.values()).filter(todo => todo.completed === completed);
    return filtered as TodoDoc[];
  }

  async findByPriority(priority: Priority, queryParams?: TodoQueryParams): Promise<TodoDoc[]> {
    this.checkError();
    const filtered = Array.from(this.todos.values()).filter(todo => todo.priority === priority);
    return filtered as TodoDoc[];
  }

  async count(filter?: any): Promise<number> {
    this.checkError();
    if (!filter) return this.todos.size;
    
    let count = 0;
    for (const todo of this.todos.values()) {
      if (filter.completed !== undefined && todo.completed !== filter.completed) continue;
      if (filter.priority && todo.priority !== filter.priority) continue;
      count++;
    }
    return count;
  }

  async ping(): Promise<boolean> {
    return !this.simulateError;
  }

  // Test utilities
  clear(): void {
    this.todos.clear();
    this.lockedTodos.clear();
    this.nextId = 1;
    this.operations = [];
  }

  size(): number {
    return this.todos.size;
  }

  // Enhanced test utilities
  private operations: Array<{ operation: string; params: any; timestamp: Date }> = [];

  getOperationCount(): number {
    return this.operations.length;
  }

  getOperations(): Array<{ operation: string; params: any; timestamp: Date }> {
    return [...this.operations];
  }

  getOperationsByType(operation: string): Array<{ operation: string; params: any; timestamp: Date }> {
    return this.operations.filter(op => op.operation === operation);
  }

  hasOperation(operation: string): boolean {
    return this.operations.some(op => op.operation === operation);
  }

  getLastOperation(): { operation: string; params: any; timestamp: Date } | undefined {
    return this.operations[this.operations.length - 1];
  }

  // Test data setup
  seedTodos(todos: Array<{ 
    title: string; 
    description?: string; 
    completed?: boolean; 
    priority?: Priority;
  }>): void {
    todos.forEach(todoData => {
      const todo: SimpleTodo = {
        id: this.nextId.toString(),
        _id: this.nextId.toString(),
        title: todoData.title,
        description: todoData.description || '',
        completed: todoData.completed || false,
        priority: todoData.priority || 'medium',
        createdAt: new Date(),
        updatedAt: new Date(),
        isLocked: false,
      };
      this.nextId++;
      this.todos.set(todo.id, todo);
    });
  }

  // Advanced assertions
  assertOperationSequence(expectedOperations: string[]): boolean {
    const actualOperations = this.operations.map(op => op.operation);
    return expectedOperations.every((op, index) => actualOperations[index] === op);
  }

  assertTodoExists(predicate: (todo: SimpleTodo) => boolean): boolean {
    return Array.from(this.todos.values()).some(predicate);
  }

  assertTodoCount(expectedCount: number): boolean {
    return this.todos.size === expectedCount;
  }

  assertLockedCount(expectedCount: number): boolean {
    return this.lockedTodos.size === expectedCount;
  }

  // Factory methods
  static create(): FakeTodoRepository {
    return new FakeTodoRepository();
  }

  static createWithTodos(todos: Array<{ 
    title: string; 
    description?: string; 
    completed?: boolean; 
    priority?: Priority;
  }>): FakeTodoRepository {
    const repo = new FakeTodoRepository();
    repo.seedTodos(todos);
    return repo;
  }

  private recordOperation(operation: string, params: any): void {
    this.operations.push({
      operation,
      params,
      timestamp: new Date(),
    });
  }

  // Simulate error conditions for testing
  simulateError: boolean = false;

  private checkError(): void {
    if (this.simulateError) {
      throw new Error('Simulated repository error');
    }
  }

  // Helper methods for test assertions
  getTodoById(id: string): SimpleTodo | undefined {
    return this.todos.get(id);
  }

  isLockedInMemory(id: string): boolean {
    return this.lockedTodos.has(id);
  }
}