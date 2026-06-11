import prisma from '../../../config/database';
import { NotFoundException } from '../../../common/exceptions/NotFoundException';

export class UserRepository {
  async create(data: any) {
    return prisma.user.create({ data });
  }

  async findById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User', id);
    }

    return user;
  }

  async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  async update(id: string, data: any) {
    return prisma.user.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return prisma.user.delete({
      where: { id },
    });
  }

  async findAll() {
    return prisma.user.findMany();
  }
}
