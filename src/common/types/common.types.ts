export type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  message?: string;
  timestamp: string;
};

export type PaginationOptions = {
  page: number;
  limit: number;
};

export type PaginatedResponse<T> = {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
};
