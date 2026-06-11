import { ApplicationException } from './ApplicationException';

export class NotFoundException extends ApplicationException {
  constructor(resource: string, id?: string) {
    const message = id ? `${resource} with id ${id} not found` : `${resource} not found`;
    super(message, 404, true);
    Object.setPrototypeOf(this, NotFoundException.prototype);
  }
}
