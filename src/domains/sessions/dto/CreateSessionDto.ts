export class CreateSessionDto {
  userId!: string;
  habitId!: string;
  duration?: number; // in seconds, default to 1500 (25 minutes)

  constructor(userId: string, habitId: string, duration?: number) {
    this.userId = userId;
    this.habitId = habitId;
    this.duration = duration;
  }
}
