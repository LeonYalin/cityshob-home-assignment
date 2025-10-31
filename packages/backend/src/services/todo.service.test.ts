import { TodoService } from './todo.service';
import { FakeTodoRepository } from '../__tests__/test-helpers/fake-todo-repository';
import { FakeLogger } from '../__tests__/test-helpers/fake-logger';
import { NotFoundError, DatabaseConnectionError } from '../errors';
import { CreateTodoInput, UpdateTodoInput } from '../schemas/todo.schema';

describe('TodoService', () => {
  let todoService: TodoService;
  let fakeRepository: FakeTodoRepository;
  let fakeLogger: FakeLogger;

  beforeEach(() => {
    fakeRepository = new FakeTodoRepository();
    fakeLogger = FakeLogger.create();
    todoService = new TodoService(fakeRepository, fakeLogger.asLogger());
  });

  afterEach(() => {
    fakeRepository.clear();
    fakeLogger.clear();
  });

  describe('getAllTodos', () => {
    it('should return all todos', async () => {
      // Setup data
      await fakeRepository.create({ title: 'Todo 1', description: 'Desc 1', priority: 'high' });
      await fakeRepository.create({ title: 'Todo 2', description: 'Desc 2', priority: 'low' });

      const todos = await todoService.getAllTodos();

      expect(todos).toHaveLength(2);
      expect(todos[0].title).toBe('Todo 1');
      expect(todos[1].title).toBe('Todo 2');
      expect(fakeLogger.hasLogWithMessage('Fetching todos')).toBe(true);
    });

    it('should return empty array when no todos exist', async () => {
      const todos = await todoService.getAllTodos();

      expect(todos).toHaveLength(0);
      expect(fakeLogger.hasLogWithMessage('Fetching todos')).toBe(true);
    });

    it('should handle repository errors', async () => {
      fakeRepository.simulateError = true;

      await expect(todoService.getAllTodos()).rejects.toThrow(DatabaseConnectionError);
      expect(fakeLogger.hasLogWithMessage('Error fetching todos')).toBe(true);
    });
  });

  describe('getTodoById', () => {
    it('should return todo when found', async () => {
      const created = await fakeRepository.create({ 
        title: 'Test Todo', 
        description: 'Test Desc', 
        priority: 'medium' 
      });

      const todo = await todoService.getTodoById(created.id);

      expect(todo).toBeTruthy();
      expect(todo?.title).toBe('Test Todo');
      expect(fakeLogger.hasLogWithMessage(`Fetching todo with id: ${created.id}`)).toBe(true);
      expect(fakeLogger.hasLogWithMessage('Found todo: Test Todo')).toBe(true);
    });

    it('should return null when todo not found', async () => {
      const todo = await todoService.getTodoById('nonexistent');

      expect(todo).toBeNull();
      expect(fakeLogger.hasLogWithMessage('Todo not found with id: nonexistent')).toBe(true);
    });

    it('should handle repository errors', async () => {
      fakeRepository.simulateError = true;

      await expect(todoService.getTodoById('any-id')).rejects.toThrow(DatabaseConnectionError);
      expect(fakeLogger.hasLogWithMessage('Error fetching todo')).toBe(true);
    });
  });

  describe('createTodo', () => {
    it('should create todo successfully', async () => {
      const input: CreateTodoInput = {
        title: 'New Todo',
        description: 'New Description',
        priority: 'high',
      };

      const todo = await todoService.createTodo(input, 'test-user-123');

      expect(todo.title).toBe('New Todo');
      expect(todo.description).toBe('New Description');
      expect(todo.priority).toBe('high');
      expect(todo.completed).toBe(false);
      expect(fakeRepository.size()).toBe(1);
      expect(fakeLogger.hasLogWithMessage('Creating new todo')).toBe(true);
      expect(fakeLogger.hasLogWithMessage(`Created todo with id: ${todo.id}`)).toBe(true);
    });

    it('should handle repository errors', async () => {
      fakeRepository.simulateError = true;
      const input: CreateTodoInput = {
        title: 'Test Todo',
        description: 'Test Desc',
        priority: 'medium',
      };

      await expect(todoService.createTodo(input, 'test-user-123')).rejects.toThrow(DatabaseConnectionError);
      expect(fakeLogger.hasLogWithMessage('Error creating todo')).toBe(true);
    });
  });

  describe('updateTodo', () => {
    it('should update todo successfully', async () => {
      const created = await fakeRepository.create({
        title: 'Original Title',
        description: 'Original Desc',
        priority: 'low',
      });

      const updateInput: UpdateTodoInput = {
        title: 'Updated Title',
        priority: 'high',
      };

      const updated = await todoService.updateTodo(created.id, updateInput);

      expect(updated).toBeTruthy();
      expect(updated?.title).toBe('Updated Title');
      expect(updated?.priority).toBe('high');
      expect(updated?.description).toBe('Original Desc'); // Unchanged
      expect(fakeLogger.hasLogWithMessage(`Updating todo with id: ${created.id}`)).toBe(true);
      expect(fakeLogger.hasLogWithMessage(`Updated todo with id: ${created.id}`)).toBe(true);
    });

    it('should return null when todo not found', async () => {
      const updateInput: UpdateTodoInput = { title: 'New Title' };

      const result = await todoService.updateTodo('nonexistent', updateInput);

      expect(result).toBeNull();
      expect(fakeLogger.hasLogWithMessage('Todo not found for update')).toBe(true);
    });

    it('should handle repository errors', async () => {
      fakeRepository.simulateError = true;
      const updateInput: UpdateTodoInput = { title: 'New Title' };

      await expect(todoService.updateTodo('any-id', updateInput)).rejects.toThrow(DatabaseConnectionError);
      expect(fakeLogger.hasLogWithMessage('Error updating todo')).toBe(true);
    });
  });

  describe('deleteTodo', () => {
    it('should delete todo successfully', async () => {
      const created = await fakeRepository.create({
        title: 'To Delete',
        description: 'Will be deleted',
        priority: 'medium',
      });

      const result = await todoService.deleteTodo(created.id);

      expect(result).toBe(true);
      expect(fakeRepository.size()).toBe(0);
      expect(fakeLogger.hasLogWithMessage(`Deleting todo with id: ${created.id}`)).toBe(true);
      expect(fakeLogger.hasLogWithMessage(`Deleted todo with id: ${created.id}`)).toBe(true);
    });

    it('should return false when todo not found', async () => {
      const result = await todoService.deleteTodo('nonexistent');

      expect(result).toBe(false);
      expect(fakeLogger.hasLogWithMessage('Todo not found for deletion')).toBe(true);
    });

    it('should handle repository errors', async () => {
      fakeRepository.simulateError = true;

      await expect(todoService.deleteTodo('any-id')).rejects.toThrow(DatabaseConnectionError);
      expect(fakeLogger.hasLogWithMessage('Error deleting todo')).toBe(true);
    });
  });

  describe('toggleTodo', () => {
    it('should toggle todo completion status', async () => {
      const created = await fakeRepository.create({
        title: 'Toggle Me',
        description: 'Toggle test',
        priority: 'medium',
      });

      // Toggle to completed
      const toggled = await todoService.toggleTodo(created.id);
      expect(toggled?.completed).toBe(true);
      expect(fakeLogger.hasLogWithMessage(`Toggling todo completion with id: ${created.id}`)).toBe(true);

      // Toggle back to incomplete
      const toggledBack = await todoService.toggleTodo(created.id);
      expect(toggledBack?.completed).toBe(false);
    });

    it('should return null when todo not found', async () => {
      const result = await todoService.toggleTodo('nonexistent');

      expect(result).toBeNull();
      expect(fakeLogger.hasLogWithMessage('Todo not found for toggle')).toBe(true);
    });

    it('should handle repository errors', async () => {
      fakeRepository.simulateError = true;

      await expect(todoService.toggleTodo('any-id')).rejects.toThrow(DatabaseConnectionError);
      expect(fakeLogger.hasLogWithMessage('Error toggling todo')).toBe(true);
    });
  });

  describe('lockTodo', () => {
    it('should lock todo successfully', async () => {
      const created = await fakeRepository.create({
        title: 'Lockable Todo',
        description: 'Can be locked',
        priority: 'high',
      });

      const locked = await todoService.lockTodo(created.id);

      expect(locked?.isLocked).toBe(true);
      expect(fakeRepository.isLockedInMemory(created.id)).toBe(true);
      expect(fakeLogger.hasLogWithMessage(`Locking todo with id: ${created.id}`)).toBe(true);
    });

    it('should return null when todo not found', async () => {
      const result = await todoService.lockTodo('nonexistent');

      expect(result).toBeNull();
      expect(fakeLogger.hasLogWithMessage('Failed to lock todo with id: nonexistent - may already be locked or not found')).toBe(true);
    });

    it('should handle repository errors', async () => {
      fakeRepository.simulateError = true;

      await expect(todoService.lockTodo('any-id')).rejects.toThrow(DatabaseConnectionError);
      expect(fakeLogger.hasLogWithMessage('Error locking todo')).toBe(true);
    });
  });

  describe('unlockTodo', () => {
    it('should unlock todo successfully', async () => {
      const created = await fakeRepository.create({
        title: 'Unlockable Todo',
        description: 'Can be unlocked',
        priority: 'low',
      });

      // First lock it
      await fakeRepository.findByIdAndLock(created.id);
      expect(fakeRepository.isLockedInMemory(created.id)).toBe(true);

      // Then unlock it
      await todoService.unlockTodo(created.id);

      expect(fakeRepository.isLockedInMemory(created.id)).toBe(false);
      expect(fakeLogger.hasLogWithMessage(`Unlocking todo with id: ${created.id}`)).toBe(true);
    });

    it('should handle repository errors', async () => {
      fakeRepository.simulateError = true;

      await expect(todoService.unlockTodo('any-id')).rejects.toThrow(DatabaseConnectionError);
      expect(fakeLogger.hasLogWithMessage('Error unlocking todo')).toBe(true);
    });
  });

  describe('getTodosByStatus', () => {
    it('should return todos by completion status', async () => {
      // Create mixed todos
      const todo1 = await fakeRepository.create({ title: 'Incomplete', description: 'Not done', priority: 'high' });
      const todo2 = await fakeRepository.create({ title: 'Complete', description: 'Done', priority: 'low' });
      
      // Toggle one to completed
      await fakeRepository.toggleCompletion(todo2.id);

      const completedTodos = await todoService.getTodosByStatus(true);
      const incompleteTodos = await todoService.getTodosByStatus(false);

      expect(completedTodos).toHaveLength(1);
      expect(completedTodos[0].title).toBe('Complete');
      expect(incompleteTodos).toHaveLength(1);
      expect(incompleteTodos[0].title).toBe('Incomplete');
    });

    it('should handle repository errors', async () => {
      fakeRepository.simulateError = true;

      await expect(todoService.getTodosByStatus(true)).rejects.toThrow(DatabaseConnectionError);
      expect(fakeLogger.hasLogWithMessage('Error fetching todos by status')).toBe(true);
    });
  });

  describe('getTodosByPriority', () => {
    it('should return todos by priority', async () => {
      await fakeRepository.create({ title: 'High Priority', description: 'Urgent', priority: 'high' });
      await fakeRepository.create({ title: 'Low Priority', description: 'Later', priority: 'low' });
      await fakeRepository.create({ title: 'Another High', description: 'Also urgent', priority: 'high' });

      const highPriorityTodos = await todoService.getTodosByPriority('high');
      const lowPriorityTodos = await todoService.getTodosByPriority('low');

      expect(highPriorityTodos).toHaveLength(2);
      expect(lowPriorityTodos).toHaveLength(1);
      expect(lowPriorityTodos[0].title).toBe('Low Priority');
    });

    it('should handle repository errors', async () => {
      fakeRepository.simulateError = true;

      await expect(todoService.getTodosByPriority('high')).rejects.toThrow(DatabaseConnectionError);
      expect(fakeLogger.hasLogWithMessage('Error fetching todos by priority')).toBe(true);
    });
  });

  describe('getTodoCount', () => {
    it('should return correct todo count', async () => {
      expect(await todoService.getTodoCount()).toBe(0);

      await fakeRepository.create({ title: 'Todo 1', description: 'First', priority: 'high' });
      expect(await todoService.getTodoCount()).toBe(1);

      await fakeRepository.create({ title: 'Todo 2', description: 'Second', priority: 'medium' });
      await fakeRepository.create({ title: 'Todo 3', description: 'Third', priority: 'low' });
      expect(await todoService.getTodoCount()).toBe(3);
    });

    it('should handle repository errors', async () => {
      fakeRepository.simulateError = true;

      await expect(todoService.getTodoCount()).rejects.toThrow(DatabaseConnectionError);
      expect(fakeLogger.hasLogWithMessage('Error getting todo count:')).toBe(true);
    });
  });
});