import prisma from '../../../config/database';
import { NotFoundException } from '../../../common/exceptions/NotFoundException';

export class SessionRepository {
  async create(data: any) {
    return prisma.session.create({ data });
  }

  async findById(id: string) {
    const session = await prisma.session.findUnique({
      where: { id },
    });

    if (!session) {
      throw new NotFoundException('Session', id);
    }

    return session;
  }

  async findByUserId(userId: string) {
    return prisma.session.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByHabitId(habitId: string) {
    return prisma.session.findMany({
      where: { habitId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findRunningSessionByUserAndHabit(userId: string, habitId: string) {
    return prisma.session.findFirst({
      where: {
        userId,
        habitId,
        status: 'RUNNING',
      },
    });
  }

  async findRunningSessionsByUserId(userId: string) {
    return prisma.session.findMany({
      where: {
        userId,
        status: 'RUNNING',
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, data: any) {
    return prisma.session.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return prisma.session.delete({
      where: { id },
    });
  }

  async findAll() {
    return prisma.session.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findSessionsByUserAndDateRange(userId: string, startDate: Date, endDate: Date) {
    return prisma.session.findMany({
      where: {
        userId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async countCompletedSessionsByHabit(habitId: string): Promise<number> {
    return prisma.session.count({
      where: {
        habitId,
        status: 'COMPLETED',
      },
    });
  }
}
