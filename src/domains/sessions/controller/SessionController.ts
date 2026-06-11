import { Request, Response, NextFunction } from 'express';
import { SessionService } from '../service/SessionService';
import { CreateSessionDto } from '../dto/CreateSessionDto';
import { ResponseHelper } from '../../../common/utils/helpers';

export class SessionController {
  private sessionService = new SessionService();

  async createSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId, habitId, duration } = req.body;
      const createSessionDto = new CreateSessionDto(userId, habitId, duration);
      const session = await this.sessionService.createSession(createSessionDto);

      res.status(201).json(ResponseHelper.success(session, 'Session created successfully'));
    } catch (error) {
      next(error);
    }
  }

  async getSessionById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const session = await this.sessionService.getSessionById(id);

      res.json(ResponseHelper.success(session, 'Session retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  async getSessionsByUserId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      const sessions = await this.sessionService.getSessionsByUserId(userId);

      res.json(ResponseHelper.success(sessions, 'Sessions retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  async getSessionsByHabitId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { habitId } = req.params;
      const sessions = await this.sessionService.getSessionsByHabitId(habitId);

      res.json(ResponseHelper.success(sessions, 'Sessions retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  async getRunningSessionsByUserId(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { userId } = req.params;
      const sessions = await this.sessionService.getRunningSessionsByUserId(userId);

      res.json(ResponseHelper.success(sessions, 'Running sessions retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  async startSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const session = await this.sessionService.startSession(id);

      res.json(ResponseHelper.success(session, 'Session started successfully'));
    } catch (error) {
      next(error);
    }
  }

  async completeSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const session = await this.sessionService.completeSession(id);

      res.json(ResponseHelper.success(session, 'Session completed successfully'));
    } catch (error) {
      next(error);
    }
  }

  async failSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const session = await this.sessionService.failSession(id);

      res.json(ResponseHelper.success(session, 'Session failed successfully'));
    } catch (error) {
      next(error);
    }
  }

  async getAllSessions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sessions = await this.sessionService.getAllSessions();
      res.json(ResponseHelper.success(sessions, 'All sessions retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }
}
