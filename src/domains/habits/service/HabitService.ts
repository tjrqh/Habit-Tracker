import { HabitRepository } from '../repository/HabitRepository';
import { UserRepository } from '../../users/repository/UserRepository';
import { CreateHabitDto } from '../dto/CreateHabitDto';
import { UpdateHabitDto } from '../dto/UpdateHabitDto';
import { HabitResponseDto } from '../dto/HabitResponseDto';
import { ValidationException } from '../../../common/exceptions/ValidationException';
import { Validators } from '../../../common/utils/validators';

export class HabitService {
  private habitRepository = new HabitRepository();
  private userRepository = new UserRepository();

  async createHabit(createHabitDto: CreateHabitDto): Promise<HabitResponseDto> {
    // Validate user exists
    await this.userRepository.findById(createHabitDto.userId);

    // Validate inputs
    Validators.validateRequiredString(createHabitDto.title, 'title');
    Validators.validatePositiveNumber(createHabitDto.targetTomato, 'targetTomato');

    const habit = await this.habitRepository.create({
      userId: createHabitDto.userId,
      title: createHabitDto.title,
      targetTomato: createHabitDto.targetTomato,
      description: createHabitDto.description,
    });

    return HabitResponseDto.fromEntity(habit);
  }

  async getHabitById(id: string): Promise<HabitResponseDto> {
    const habit = await this.habitRepository.findById(id);
    return HabitResponseDto.fromEntity(habit);
  }

  async getHabitsByUserId(userId: string): Promise<HabitResponseDto[]> {
    // Verify user exists
    await this.userRepository.findById(userId);

    const habits = await this.habitRepository.findByUserId(userId);
    return habits.map(habit => HabitResponseDto.fromEntity(habit));
  }

  async getActiveHabitsByUserId(userId: string): Promise<HabitResponseDto[]> {
    // Verify user exists
    await this.userRepository.findById(userId);

    const habits = await this.habitRepository.findActiveByUserId(userId);
    return habits.map(habit => HabitResponseDto.fromEntity(habit));
  }

  async updateHabit(id: string, updateHabitDto: UpdateHabitDto): Promise<HabitResponseDto> {
    // Verify habit exists
    await this.habitRepository.findById(id);

    // Validate inputs if provided
    if (updateHabitDto.title !== undefined) {
      Validators.validateRequiredString(updateHabitDto.title, 'title');
    }
    if (updateHabitDto.targetTomato !== undefined) {
      Validators.validatePositiveNumber(updateHabitDto.targetTomato, 'targetTomato');
    }

    const habit = await this.habitRepository.update(id, updateHabitDto);
    return HabitResponseDto.fromEntity(habit);
  }

  async deleteHabit(id: string): Promise<void> {
    await this.habitRepository.delete(id);
  }

  async getAllHabits(): Promise<HabitResponseDto[]> {
    const habits = await this.habitRepository.findAll();
    return habits.map(habit => HabitResponseDto.fromEntity(habit));
  }
}
