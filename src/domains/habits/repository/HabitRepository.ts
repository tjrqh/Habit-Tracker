import prisma from '../../../config/database';
import { NotFoundException } from '../../../common/exceptions/NotFoundException';

export class HabitRepository {
  async create(data: any) {
    return prisma.habit.create({ data });
  }

  async findById(id: string) {
    const habit = await prisma.habit.findUnique({
      where: { id },
    });

    if (!habit) {
      throw new NotFoundException('Habit', id);
    }

    return habit;
  }

  async findByUserId(userId: string) {
    return prisma.habit.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, data: any) {
    return prisma.habit.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return prisma.habit.delete({
      where: { id },
    });
  }

  async findAll() {
    return prisma.habit.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findActiveByUserId(userId: string) {
    return prisma.habit.findMany({
      where: { userId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
