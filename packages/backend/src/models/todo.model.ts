import { Document, Model, Schema, model } from 'mongoose';
import { CreateTodoInput } from '../schemas/todo.schema';
import type { Priority } from '@real-time-todo/common';

// Document interface extending Mongoose Document
export interface TodoDoc extends Document {
  title: string;
  description: string;
  completed: boolean;
  priority: Priority;
  createdBy: string; // User ID who created the todo
  createdAt: Date;
  updatedAt: Date;
  isLocked: boolean;
  lockedBy: string; // User ID who locked the todo (empty string if not locked)
  lockedAt: Date | null; // Date when locked (null if not locked)
}

// Model interface for static methods
export interface TodoModel extends Model<TodoDoc> {
  build(todoData: CreateTodoInput & { createdBy: string }): TodoDoc;
  findByIdAndLock(id: string, userId: string): Promise<TodoDoc | null>;
  unlockTodo(id: string, userId?: string): Promise<void>;
}

// Mongoose schema definition
const todoSchema = new Schema<TodoDoc, TodoModel>(
  {
    title: { 
      type: String, 
      required: true,
      trim: true,
      maxlength: 200
    },
    description: { 
      type: String, 
      default: '',
      trim: true,
      maxlength: 1000
    },
    completed: { 
      type: Boolean, 
      default: false 
    },
    priority: { 
      type: String, 
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    createdBy: {
      type: String,
      required: true
    },
    isLocked: { 
      type: Boolean, 
      default: false 
    },
    lockedBy: { 
      type: String, 
      default: '' 
    },
    lockedAt: { 
      type: Date, 
      default: null 
    }
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        // Don't expose internal isLocked field
        delete ret.isLocked;
      },
    },
  }
);

// Static method to build a new todo
todoSchema.statics.build = function (todoData: CreateTodoInput & { createdBy: string }): TodoDoc {
  return new Todo({
    title: todoData.title,
    description: todoData.description || '',
    priority: todoData.priority || 'medium',
    createdBy: todoData.createdBy,
    completed: false,
    isLocked: false,
    lockedBy: '',
    lockedAt: null,
  });
};

// Static method to find and lock a todo for editing
todoSchema.statics.findByIdAndLock = async function (
  id: string, 
  userId: string
): Promise<TodoDoc | null> {
  const todo = await this.findOneAndUpdate(
    { 
      _id: id, 
      $or: [
        { isLocked: false },
        { lockedBy: userId }, // User can re-lock their own locked todo
        { lockedAt: { $lt: new Date(Date.now() - 5 * 60 * 1000) } } // 5 minute timeout
      ]
    },
    { 
      isLocked: true, 
      lockedBy: userId, 
      lockedAt: new Date() 
    },
    { new: true }
  );
  
  return todo;
};

// Static method to unlock a todo
todoSchema.statics.unlockTodo = async function (id: string, userId?: string): Promise<void> {
  const updateQuery: any = {
    isLocked: false,
    lockedBy: '',
    lockedAt: null
  };

  // If userId is provided, only unlock if the user owns the lock or if it's expired
  const findQuery: any = { _id: id };
  if (userId) {
    findQuery.$or = [
      { lockedBy: userId },
      { lockedAt: { $lt: new Date(Date.now() - 5 * 60 * 1000) } }
    ];
  }

  await this.findOneAndUpdate(findQuery, updateQuery);
};

// Index for better query performance
todoSchema.index({ completed: 1, priority: 1, createdAt: -1 });
todoSchema.index({ isLocked: 1, lockedAt: 1 });

// Create and export the model
const Todo = model<TodoDoc, TodoModel>('Todo', todoSchema);

export { Todo };