import { BaseError } from './base.error';

export class DatabaseConnectionError extends BaseError {
  statusCode = 500;
  message: string;

  constructor(message: string = 'Database connection failed') {
    super(message);
    this.message = message;
    Object.setPrototypeOf(this, DatabaseConnectionError.prototype);
  }

  serializeErrors() {
    return [{ message: this.message }];
  }
}