import { z } from 'zod';

// Priority enum schema
export const PrioritySchema = z.enum(['low', 'medium', 'high']);

// Base Todo schema for creation
export const CreateTodoSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters')
    .trim(),
  description: z.string()
    .max(1000, 'Description must be less than 1000 characters')
    .trim()
    .optional()
    .default(''),
  priority: PrioritySchema.optional().default('medium'),
});

// Schema for updating a Todo
export const UpdateTodoSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters')
    .trim()
    .optional(),
  description: z.string()
    .max(1000, 'Description must be less than 1000 characters')
    .trim()
    .optional(),
  priority: PrioritySchema.optional(),
  completed: z.boolean().optional(),
});

// Schema for Todo ID parameter validation
export const TodoIdSchema = z.object({
  id: z.string()
    .min(1, 'Todo ID is required')
    .refine(
      (val) => /^[a-fA-F0-9]{24}$/.test(val) || /^\d+$/.test(val), 
      'Invalid Todo ID format'
    ), // MongoDB ObjectId format or simple numeric ID
});

// Schema for query parameters
export const TodoQuerySchema = z.object({
  completed: z.string()
    .transform((val) => val === 'true')
    .optional(),
  priority: PrioritySchema.optional(),
  limit: z.coerce.number()
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit must be at most 100')
    .default(10),
  page: z.coerce.number()
    .min(1, 'Page must be at least 1')
    .default(1),
});

// Type exports for TypeScript
export type CreateTodoInput = z.infer<typeof CreateTodoSchema>;
export type UpdateTodoInput = z.infer<typeof UpdateTodoSchema>;
export type TodoIdParams = z.infer<typeof TodoIdSchema>;
export type TodoQueryParams = z.infer<typeof TodoQuerySchema>;
export type Priority = z.infer<typeof PrioritySchema>;
