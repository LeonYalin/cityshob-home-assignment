import { Router } from 'express';
import { todoController } from '../controllers/todo.controller';
import { validateSchema } from '../middleware/zod-validation.middleware';
import { 
  CreateTodoSchema, 
  UpdateTodoSchema, 
  TodoIdSchema,
  TodoQuerySchema 
} from '../schemas/todo.schema';

const router = Router();

// GET /api/todos - Get all todos
router.get('/', 
  validateSchema({ query: TodoQuerySchema }),
  todoController.getAllTodos
);

// POST /api/todos - Create a new todo
router.post('/', 
  validateSchema({ body: CreateTodoSchema }),
  todoController.createTodo
);

// GET /api/todos/:id - Get a specific todo
router.get('/:id', 
  validateSchema({ params: TodoIdSchema }),
  todoController.getTodoById
);

// PUT /api/todos/:id - Update a todo
router.put('/:id', 
  validateSchema({ 
    params: TodoIdSchema, 
    body: UpdateTodoSchema 
  }),
  todoController.updateTodo
);

// DELETE /api/todos/:id - Delete a todo
router.delete('/:id', 
  validateSchema({ params: TodoIdSchema }),
  todoController.deleteTodo
);

// PATCH /api/todos/:id/toggle - Toggle todo completion status
router.patch('/:id/toggle', 
  validateSchema({ params: TodoIdSchema }),
  todoController.toggleTodo
);

export { router as todoRoutes };