import { BaseError } from './base.error';

export class DatabaseConnectionError extends BaseError {
  statusCode = 500;
  message: string;

  constructor(message: string = 'Database connection error') {
    super(message);
    this.message = message;
    this.name = 'DatabaseConnectionError';
    Object.setPrototypeOf(this, DatabaseConnectionError.prototype);
  }

  serializeErrors() {
    return [{ message: this.message }];
  }
}