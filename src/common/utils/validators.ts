import { ValidationException } from '../exceptions/ValidationException';

export class Validators {
  static isEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static isStrongPassword(password: string): boolean {
    // At least 8 chars, 1 uppercase, 1 lowercase, 1 number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    return passwordRegex.test(password);
  }

  static validateEmail(email: string): void {
    if (!this.isEmail(email)) {
      throw new ValidationException('Invalid email format', {
        email: ['Invalid email format'],
      });
    }
  }

  static validatePassword(password: string): void {
    if (!this.isStrongPassword(password)) {
      throw new ValidationException('Password is too weak', {
        password: [
          'Password must be at least 8 characters with uppercase, lowercase, and numbers',
        ],
      });
    }
  }

  static validateRequiredString(value: any, fieldName: string): string {
    if (typeof value !== 'string' || value.trim() === '') {
      throw new ValidationException(`${fieldName} is required`, {
        [fieldName]: [`${fieldName} is required`],
      });
    }
    return value.trim();
  }

  static validatePositiveNumber(value: any, fieldName: string): number {
    const num = parseInt(value, 10);
    if (isNaN(num) || num <= 0) {
      throw new ValidationException(`${fieldName} must be a positive number`, {
        [fieldName]: [`${fieldName} must be a positive number`],
      });
    }
    return num;
  }
}
