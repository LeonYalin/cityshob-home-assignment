import { Router } from 'express';
import { todoController } from '../controllers/todo.controller';
import { validateSchema } from '../middleware/zod-validation.middleware';
import { AuthMiddleware } from '../middleware/auth.middleware';
import { 
  CreateTodoSchema, 
  UpdateTodoSchema, 
  TodoIdSchema,
  TodoQuerySchema 
} from '../schemas/todo.schema';

const router = Router();

// GET /api/todos - Get all todos (requires authentication)
router.get('/', 
  AuthMiddleware.authenticate,
  validateSchema({ query: TodoQuerySchema }),
  todoController.getAllTodos
);

// POST /api/todos - Create a new todo (requires authentication)
router.post('/', 
  AuthMiddleware.authenticate,
  validateSchema({ body: CreateTodoSchema }),
  todoController.createTodo
);

// GET /api/todos/:id - Get a specific todo (requires authentication)
router.get('/:id', 
  AuthMiddleware.authenticate,
  validateSchema({ params: TodoIdSchema }),
  todoController.getTodoById
);

// PUT /api/todos/:id - Update a todo (requires authentication)
router.put('/:id', 
  AuthMiddleware.authenticate,
  validateSchema({ 
    params: TodoIdSchema, 
    body: UpdateTodoSchema 
  }),
  todoController.updateTodo
);

// DELETE /api/todos/:id - Delete a todo (requires authentication)
router.delete('/:id', 
  AuthMiddleware.authenticate,
  validateSchema({ params: TodoIdSchema }),
  todoController.deleteTodo
);

// PATCH /api/todos/:id/toggle - Toggle todo completion status (requires authentication)
router.patch('/:id/toggle', 
  AuthMiddleware.authenticate,
  validateSchema({ params: TodoIdSchema }),
  todoController.toggleTodo
);

// POST /api/todos/:id/lock - Lock a todo for editing (requires authentication)
router.post('/:id/lock', 
  AuthMiddleware.authenticate,
  validateSchema({ params: TodoIdSchema }),
  todoController.lockTodo
);

// POST /api/todos/:id/unlock - Unlock a todo (requires authentication)
router.post('/:id/unlock', 
  AuthMiddleware.authenticate,
  validateSchema({ params: TodoIdSchema }),
  todoController.unlockTodo
);

export { router as todoRoutes };