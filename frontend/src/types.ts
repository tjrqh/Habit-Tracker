export interface User {
  id: string;
  email: string;
}

export interface Habit {
  id: string;
  userId: string;
  title: string;
  targetTomato: number;
  description?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Session {
  id: string;
  userId: string;
  habitId: string;
  status: string;
  duration: number;
  startTime?: string;
  endTime?: string;
  createdAt: string;
}

export interface HabitConfig {
  duration: number; // in seconds
  autoRepeat: boolean;
}
