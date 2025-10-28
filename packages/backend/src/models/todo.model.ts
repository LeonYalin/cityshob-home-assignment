import { Document, Model, Schema, model } from 'mongoose';
import { CreateTodoInput, Priority } from '../schemas/todo.schema';

// Document interface extending Mongoose Document
export interface TodoDoc extends Document {
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

// Model interface for static methods
export interface TodoModel extends Model<TodoDoc> {
  build(todoData: CreateTodoInput): TodoDoc;
  findByIdAndLock(id: string, userId?: string): Promise<TodoDoc | null>;
  unlockTodo(id: string): Promise<void>;
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
    isLocked: { 
      type: Boolean, 
      default: false 
    },
    lockedBy: { 
      type: String, 
      required: false 
    },
    lockedAt: { 
      type: Date, 
      required: false 
    }
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        // Don't expose locking fields in regular API responses
        delete ret.isLocked;
        delete ret.lockedBy;
        delete ret.lockedAt;
      },
    },
  }
);

// Static method to build a new todo
todoSchema.statics.build = function (todoData: CreateTodoInput): TodoDoc {
  return new Todo({
    title: todoData.title,
    description: todoData.description || '',
    priority: todoData.priority || 'medium',
    completed: false,
    isLocked: false,
  });
};

// Static method to find and lock a todo for editing
todoSchema.statics.findByIdAndLock = async function (
  id: string, 
  userId: string = 'anonymous'
): Promise<TodoDoc | null> {
  const todo = await this.findOneAndUpdate(
    { 
      _id: id, 
      $or: [
        { isLocked: false },
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
todoSchema.statics.unlockTodo = async function (id: string): Promise<void> {
  await this.findByIdAndUpdate(id, {
    isLocked: false,
    $unset: { lockedBy: 1, lockedAt: 1 }
  });
};

// Index for better query performance
todoSchema.index({ completed: 1, priority: 1, createdAt: -1 });
todoSchema.index({ isLocked: 1, lockedAt: 1 });

// Create and export the model
const Todo = model<TodoDoc, TodoModel>('Todo', todoSchema);

export { Todo };