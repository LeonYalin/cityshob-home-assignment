import { BaseError } from './base.error';

export class ValidationError extends BaseError {
  statusCode = 400;
  message: string;
  errors: { message: string; field?: string }[];

  constructor(errors: { message: string; field?: string }[] = []) {
    const message = errors.length > 0 ? 'Validation failed' : 'Validation failed';
    super(message);
    this.message = message;
    this.errors = errors;
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }

  serializeErrors() {
    return this.errors.length > 0 ? this.errors : [{ message: this.message }];
  }
}