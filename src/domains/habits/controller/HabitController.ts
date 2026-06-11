import { Request, Response, NextFunction } from 'express';
import { HabitService } from '../service/HabitService';
import { CreateHabitDto } from '../dto/CreateHabitDto';
import { UpdateHabitDto } from '../dto/UpdateHabitDto';
import { ResponseHelper } from '../../../common/utils/helpers';

export class HabitController {
  private habitService = new HabitService();

  async createHabit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId, title, targetTomato, description } = req.body;
      const createHabitDto = new CreateHabitDto(userId, title, targetTomato, description);
      const habit = await this.habitService.createHabit(createHabitDto);

      res.status(201).json(ResponseHelper.success(habit, 'Habit created successfully'));
    } catch (error) {
      next(error);
    }
  }

  async getHabitById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const habit = await this.habitService.getHabitById(id);

      res.json(ResponseHelper.success(habit, 'Habit retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  async getHabitsByUserId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      const habits = await this.habitService.getHabitsByUserId(userId);

      res.json(ResponseHelper.success(habits, 'Habits retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  async getActiveHabits(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      const habits = await this.habitService.getActiveHabitsByUserId(userId);

      res.json(ResponseHelper.success(habits, 'Active habits retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  async updateHabit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { title, targetTomato, description, isActive } = req.body;
      const updateHabitDto = new UpdateHabitDto(title, targetTomato, description, isActive);
      const habit = await this.habitService.updateHabit(id, updateHabitDto);

      res.json(ResponseHelper.success(habit, 'Habit updated successfully'));
    } catch (error) {
      next(error);
    }
  }

  async deleteHabit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await this.habitService.deleteHabit(id);

      res.json(ResponseHelper.success(null, 'Habit deleted successfully'));
    } catch (error) {
      next(error);
    }
  }

  async getAllHabits(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const habits = await this.habitService.getAllHabits();
      res.json(ResponseHelper.success(habits, 'All habits retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }
}
