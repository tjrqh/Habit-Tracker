import { SessionRepository } from '../repository/SessionRepository';
import { HabitRepository } from '../../habits/repository/HabitRepository';
import { UserRepository } from '../../users/repository/UserRepository';
import { PomodoroSession } from '../entity/PomodoroSession';
import { CreateSessionDto } from '../dto/CreateSessionDto';
import { UpdateSessionDto } from '../dto/UpdateSessionDto';
import { SessionResponseDto } from '../dto/SessionResponseDto';
import { SessionStatus } from '../types/sessionStatus';
import { ValidationException } from '../../../common/exceptions/ValidationException';
import { ApplicationException } from '../../../common/exceptions/ApplicationException';
import { Validators } from '../../../common/utils/validators';

export class SessionService {
  private sessionRepository = new SessionRepository();
  private habitRepository = new HabitRepository();
  private userRepository = new UserRepository();

  /**
   * 새로운 포모도로 세션을 생성합니다.
   */
  async createSession(createSessionDto: CreateSessionDto): Promise<SessionResponseDto> {
    // Validate user and habit exist
    await this.userRepository.findById(createSessionDto.userId);
    await this.habitRepository.findById(createSessionDto.habitId);

    // Check if session with same habit is already running
    const runningSession = await this.sessionRepository.findRunningSessionByUserAndHabit(
      createSessionDto.userId,
      createSessionDto.habitId,
    );

    if (runningSession) {
      throw new ApplicationException(
        'A session for this habit is already running. Please complete or fail it first.',
        400,
      );
    }

    const duration = createSessionDto.duration || 1500; // Default 25 minutes
    Validators.validatePositiveNumber(duration, 'duration');

    const session = await this.sessionRepository.create({
      userId: createSessionDto.userId,
      habitId: createSessionDto.habitId,
      status: SessionStatus.IDLE,
      duration,
    });

    const pomodoroSession = PomodoroSession.fromPersistence(session);
    return SessionResponseDto.fromEntity(pomodoroSession);
  }

  /**
   * 세션을 시작합니다.
   */
  async startSession(id: string): Promise<SessionResponseDto> {
    const sessionData = await this.sessionRepository.findById(id);
    const pomodoroSession = PomodoroSession.fromPersistence(sessionData);

    // DDD Entity의 비즈니스 로직 적용
    pomodoroSession.start();

    // DB에 저장
    const updatedSessionData = await this.sessionRepository.update(id, {
      status: pomodoroSession.getStatus(),
      startTime: pomodoroSession.getStartTime(),
      updatedAt: new Date(),
    });

    const updatedSession = PomodoroSession.fromPersistence(updatedSessionData);
    return SessionResponseDto.fromEntity(updatedSession);
  }

  /**
   * 세션을 완료합니다.
   */
  async completeSession(id: string): Promise<SessionResponseDto> {
    const sessionData = await this.sessionRepository.findById(id);
    const pomodoroSession = PomodoroSession.fromPersistence(sessionData);

    // DDD Entity의 비즈니스 로직 적용
    pomodoroSession.complete();

    // DB에 저장
    const updatedSessionData = await this.sessionRepository.update(id, {
      status: pomodoroSession.getStatus(),
      endTime: pomodoroSession.getEndTime(),
      updatedAt: new Date(),
    });

    const updatedSession = PomodoroSession.fromPersistence(updatedSessionData);
    return SessionResponseDto.fromEntity(updatedSession);
  }

  /**
   * 세션을 실패로 표시합니다.
   */
  async failSession(id: string): Promise<SessionResponseDto> {
    const sessionData = await this.sessionRepository.findById(id);
    const pomodoroSession = PomodoroSession.fromPersistence(sessionData);

    // DDD Entity의 비즈니스 로직 적용
    pomodoroSession.fail();

    // DB에 저장
    const updatedSessionData = await this.sessionRepository.update(id, {
      status: pomodoroSession.getStatus(),
      endTime: pomodoroSession.getEndTime(),
      updatedAt: new Date(),
    });

    const updatedSession = PomodoroSession.fromPersistence(updatedSessionData);
    return SessionResponseDto.fromEntity(updatedSession);
  }

  /**
   * 세션 ID로 조회합니다.
   */
  async getSessionById(id: string): Promise<SessionResponseDto> {
    const sessionData = await this.sessionRepository.findById(id);
    const pomodoroSession = PomodoroSession.fromPersistence(sessionData);
    return SessionResponseDto.fromEntity(pomodoroSession);
  }

  /**
   * 사용자의 모든 세션을 조회합니다.
   */
  async getSessionsByUserId(userId: string): Promise<SessionResponseDto[]> {
    await this.userRepository.findById(userId);

    const sessions = await this.sessionRepository.findByUserId(userId);
    return sessions.map(session => {
      const pomodoroSession = PomodoroSession.fromPersistence(session);
      return SessionResponseDto.fromEntity(pomodoroSession);
    });
  }

  /**
   * 습관의 모든 세션을 조회합니다.
   */
  async getSessionsByHabitId(habitId: string): Promise<SessionResponseDto[]> {
    await this.habitRepository.findById(habitId);

    const sessions = await this.sessionRepository.findByHabitId(habitId);
    return sessions.map(session => {
      const pomodoroSession = PomodoroSession.fromPersistence(session);
      return SessionResponseDto.fromEntity(pomodoroSession);
    });
  }

  /**
   * 사용자의 진행 중인 세션을 조회합니다.
   */
  async getRunningSessionsByUserId(userId: string): Promise<SessionResponseDto[]> {
    await this.userRepository.findById(userId);

    const sessions = await this.sessionRepository.findRunningSessionsByUserId(userId);
    return sessions.map(session => {
      const pomodoroSession = PomodoroSession.fromPersistence(session);
      return SessionResponseDto.fromEntity(pomodoroSession);
    });
  }

  /**
   * 모든 세션을 조회합니다 (관리자용).
   */
  async getAllSessions(): Promise<SessionResponseDto[]> {
    const sessions = await this.sessionRepository.findAll();
    return sessions.map(session => {
      const pomodoroSession = PomodoroSession.fromPersistence(session);
      return SessionResponseDto.fromEntity(pomodoroSession);
    });
  }

  /**
   * 날짜 범위로 세션을 조회합니다.
   */
  async getSessionsByUserAndDateRange(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<SessionResponseDto[]> {
    await this.userRepository.findById(userId);

    const sessions = await this.sessionRepository.findSessionsByUserAndDateRange(
      userId,
      startDate,
      endDate,
    );
    return sessions.map(session => {
      const pomodoroSession = PomodoroSession.fromPersistence(session);
      return SessionResponseDto.fromEntity(pomodoroSession);
    });
  }

  /**
   * 습관의 완료된 세션 개수를 반환합니다.
   */
  async getCompletedSessionCountByHabit(habitId: string): Promise<number> {
    return this.sessionRepository.countCompletedSessionsByHabit(habitId);
  }
}
