import { BaseError } from './base.error';

export class NotFoundError extends BaseError {
  statusCode = 404;
  message: string;

  constructor(message: string = 'Not found') {
    super(message);
    this.message = message;
    this.name = 'NotFoundError';
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }

  serializeErrors() {
    return [{ message: this.message }];
  }
}