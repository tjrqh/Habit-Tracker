export class SessionResponseDto {
  id!: string;
  userId!: string;
  habitId!: string;
  status!: string;
  startTime?: Date;
  endTime?: Date;
  duration!: number;
  elapsedSeconds!: number;
  remainingSeconds!: number;
  createdAt!: Date;
  updatedAt!: Date;

  constructor(
    id: string,
    userId: string,
    habitId: string,
    status: string,
    duration: number,
    elapsedSeconds: number,
    remainingSeconds: number,
    createdAt: Date,
    updatedAt: Date,
    startTime?: Date,
    endTime?: Date,
  ) {
    this.id = id;
    this.userId = userId;
    this.habitId = habitId;
    this.status = status;
    this.duration = duration;
    this.elapsedSeconds = elapsedSeconds;
    this.remainingSeconds = remainingSeconds;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.startTime = startTime;
    this.endTime = endTime;
  }

  static fromEntity(entity: any): SessionResponseDto {
    return new SessionResponseDto(
      entity.id,
      entity.userId,
      entity.habitId,
      entity.status,
      entity.duration,
      entity.getElapsedSeconds?.() || 0,
      entity.getRemainingSeconds?.() || entity.duration,
      entity.createdAt,
      entity.updatedAt,
      entity.startTime,
      entity.endTime,
    );
  }
}
