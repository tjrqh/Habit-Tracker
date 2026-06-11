import { ApplicationException } from './ApplicationException';

export class ValidationException extends ApplicationException {
  public readonly errors: Record<string, string[]>;

  constructor(message: string, errors: Record<string, string[]> = {}) {
    super(message, 400, true);
    Object.setPrototypeOf(this, ValidationException.prototype);

    this.errors = errors;
  }
}
