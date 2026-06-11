import { ApiResponse } from '../types/common.types';

export class ResponseHelper {
  static success<T>(data: T, message: string = 'Success'): ApiResponse<T> {
    return {
      success: true,
      data,
      message,
      timestamp: new Date().toISOString(),
    };
  }

  static error(message: string): ApiResponse {
    return {
      success: false,
      message,
      timestamp: new Date().toISOString(),
    };
  }
}

export class DateHelper {
  static addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  static startOfDay(date: Date): Date {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
  }

  static endOfDay(date: Date): Date {
    const result = new Date(date);
    result.setHours(23, 59, 59, 999);
    return result;
  }

  static differenceInSeconds(date1: Date, date2: Date): number {
    return Math.floor((date1.getTime() - date2.getTime()) / 1000);
  }

  static differenceInMinutes(date1: Date, date2: Date): number {
    return Math.floor(this.differenceInSeconds(date1, date2) / 60);
  }
}
