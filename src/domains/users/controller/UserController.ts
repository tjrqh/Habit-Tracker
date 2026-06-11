import { Request, Response, NextFunction } from 'express';
import { UserService } from '../service/UserService';
import { CreateUserDto } from '../dto/CreateUserDto';
import { ResponseHelper } from '../../../common/utils/helpers';

export class UserController {
  private userService = new UserService();

  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;

      const createUserDto = new CreateUserDto(email, password);
      const user = await this.userService.register(createUserDto);

      res.status(201).json(ResponseHelper.success(user, 'User registered successfully'));
    } catch (error) {
      next(error);
    }
  }

  async getUserById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const user = await this.userService.getUserById(id);

      res.json(ResponseHelper.success(user, 'User retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  async getAllUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const users = await this.userService.getAllUsers();
      res.json(ResponseHelper.success(users, 'Users retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  async deleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await this.userService.deleteUser(id);

      res.json(ResponseHelper.success(null, 'User deleted successfully'));
    } catch (error) {
      next(error);
    }
  }
}
