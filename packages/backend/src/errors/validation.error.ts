import { BaseError } from './base.error';

export class ValidationError extends BaseError {
  statusCode = 400;
  message: string;

  constructor(message: string = 'Validation failed') {
    super(message);
    this.message = message;
    Object.setPrototypeOf(this, ValidationError.prototype);
  }

  serializeErrors() {
    return [{ message: this.message }];
  }
}