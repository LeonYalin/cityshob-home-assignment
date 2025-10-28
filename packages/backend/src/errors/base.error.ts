export abstract class BaseError extends Error {
  abstract statusCode: number;
  abstract message: string;

  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, BaseError.prototype);
  }

  abstract serializeErrors(): { message: string; field?: string }[];
}