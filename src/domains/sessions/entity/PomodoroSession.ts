import { SessionStatus } from '../types/sessionStatus';
import { ApplicationException } from '../../../common/exceptions/ApplicationException';
import { DateHelper } from '../../../common/utils/helpers';

/**
 * DDD Entity: PomodoroSession
 * 풍부한 도메인 모델로서 상태 변화 로직과 시간 계산 로직을 포함합니다.
 * 빈혈 모델을 피하고 비즈니스 규칙을 도메인 계층에 집중시킵니다.
 */
export class PomodoroSession {
  private id: string;
  private userId: string;
  private habitId: string;
  private status: SessionStatus;
  private startTime: Date | null;
  private endTime: Date | null;
  private duration: number; // in seconds
  private createdAt: Date;
  private updatedAt: Date;

  constructor(
    id: string,
    userId: string,
    habitId: string,
    status: SessionStatus,
    duration: number,
    createdAt: Date,
    updatedAt: Date,
    startTime: Date | null = null,
    endTime: Date | null = null,
  ) {
    this.id = id;
    this.userId = userId;
    this.habitId = habitId;
    this.status = status;
    this.startTime = startTime;
    this.endTime = endTime;
    this.duration = duration;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  /**
   * 세션을 시작합니다.
   * 조건: 상태가 IDLE이어야 함
   */
  public start(): void {
    if (this.status !== SessionStatus.IDLE) {
      throw new ApplicationException(
        `Cannot start session with status ${this.status}. Only IDLE sessions can be started.`,
        400,
      );
    }

    this.status = SessionStatus.RUNNING;
    this.startTime = new Date();
    this.updatedAt = new Date();
  }

  /**
   * 세션을 완료합니다.
   * 조건: 상태가 RUNNING이어야 함
   */
  public complete(): void {
    if (this.status !== SessionStatus.RUNNING) {
      throw new ApplicationException(
        `Cannot complete session with status ${this.status}. Only RUNNING sessions can be completed.`,
        400,
      );
    }

    this.status = SessionStatus.COMPLETED;
    this.endTime = new Date();
    this.updatedAt = new Date();
  }

  /**
   * 세션을 실패로 표시합니다.
   * 조건: 상태가 RUNNING이어야 함
   */
  public fail(): void {
    if (this.status !== SessionStatus.RUNNING) {
      throw new ApplicationException(
        `Cannot fail session with status ${this.status}. Only RUNNING sessions can fail.`,
        400,
      );
    }

    this.status = SessionStatus.FAILED;
    this.endTime = new Date();
    this.updatedAt = new Date();
  }

  /**
   * 경과 시간(초)을 계산합니다.
   * 조건: RUNNING 또는 COMPLETED 상태에서만 의미있는 값 반환
   */
  public getElapsedSeconds(): number {
    if (!this.startTime) return 0;

    const end = this.endTime || new Date();
    return DateHelper.differenceInSeconds(end, this.startTime);
  }

  /**
   * 경과 시간(분)을 계산합니다.
   */
  public getElapsedMinutes(): number {
    return Math.floor(this.getElapsedSeconds() / 60);
  }

  /**
   * 남은 시간(초)을 계산합니다.
   * 조건: RUNNING 상태에서만 의미있는 값 반환
   */
  public getRemainingSeconds(): number {
    if (this.status !== SessionStatus.RUNNING || !this.startTime) return this.duration;

    const elapsed = this.getElapsedSeconds();
    const remaining = this.duration - elapsed;
    return Math.max(0, remaining);
  }

  /**
   * 남은 시간(분)을 계산합니다.
   */
  public getRemainingMinutes(): number {
    return Math.floor(this.getRemainingSeconds() / 60);
  }

  /**
   * 세션이 시간 초과되었는지 확인합니다.
   */
  public isTimeExpired(): boolean {
    return this.getRemainingSeconds() <= 0;
  }

  /**
   * 세션이 성공했는지 확인합니다 (목표 시간 이상 완료)
   */
  public isSuccessful(): boolean {
    return this.status === SessionStatus.COMPLETED && this.getElapsedSeconds() >= this.duration;
  }

  /**
   * 원시 값으로 변환합니다 (persistence layer에 전달용)
   */
  public toPersistence(): any {
    return {
      id: this.id,
      userId: this.userId,
      habitId: this.habitId,
      status: this.status,
      startTime: this.startTime,
      endTime: this.endTime,
      duration: this.duration,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * DB 데이터로부터 도메인 엔티티를 생성합니다.
   */
  public static fromPersistence(data: any): PomodoroSession {
    return new PomodoroSession(
      data.id,
      data.userId,
      data.habitId,
      data.status as SessionStatus,
      data.duration,
      data.createdAt,
      data.updatedAt,
      data.startTime,
      data.endTime,
    );
  }

  // Getters
  getId(): string {
    return this.id;
  }

  getUserId(): string {
    return this.userId;
  }

  getHabitId(): string {
    return this.habitId;
  }

  getStatus(): SessionStatus {
    return this.status;
  }

  getStartTime(): Date | null {
    return this.startTime;
  }

  getEndTime(): Date | null {
    return this.endTime;
  }

  getDuration(): number {
    return this.duration;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }
}
