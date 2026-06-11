import { ApplicationException } from './ApplicationException';

export class UnauthorizedException extends ApplicationException {
  constructor(message: string = 'Unauthorized access') {
    super(message, 401, true);
    Object.setPrototypeOf(this, UnauthorizedException.prototype);
  }
}
