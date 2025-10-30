import { BaseError } from './base.error';

export class TodoLockError extends BaseError {
  statusCode = 409;
  message: string;

  constructor(message: string = 'Todo is locked and cannot be modified') {
    super(message);
    this.message = message;
    this.name = 'TodoLockError';
    Object.setPrototypeOf(this, TodoLockError.prototype);
  }

  serializeErrors(): { message: string; field?: string }[] {
    return [{ message: this.message }];
  }
}