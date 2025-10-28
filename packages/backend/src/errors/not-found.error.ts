import { BaseError } from './base.error';

export class NotFoundError extends BaseError {
  statusCode = 404;
  message: string;

  constructor(message: string = 'Resource not found') {
    super(message);
    this.message = message;
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }

  serializeErrors() {
    return [{ message: this.message }];
  }
}