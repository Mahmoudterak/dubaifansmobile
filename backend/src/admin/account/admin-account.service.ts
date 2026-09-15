import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma.service';

export interface CreateAdminUserDto {
  name: string;
  email: string;
  phone?: string;
  password: string;
  role: UserRole;
}

export interface UpdateAdminUserDto {
  name?: string;
  email?: string;
  phone?: string;
  role?: UserRole;
}

@Injectable()
export class AdminAccountService {
  constructor(private readonly prisma: PrismaService) {}

  async findStaff() {
    return this.prisma.user.findMany({
      where: {
        role: {
          in: [
            UserRole.ADMIN,
            UserRole.MANAGER,
            UserRole.EMPLOYEE,
          ],
        },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async createStaff(dto: CreateAdminUserDto) {
    const email = dto.email.trim().toLowerCase();

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    return this.prisma.user.create({
      data: {
        name: dto.name.trim(),
        email,
        phone: dto.phone?.trim() || undefined,
        password: passwordHash,
        role: dto.role,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async updateStaff(
    currentAdminId: string,
    userId: string,
    dto: UpdateAdminUserDto,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (
      !user ||
      (
        user.role !== UserRole.ADMIN &&
        user.role !== UserRole.MANAGER &&
        user.role !== UserRole.EMPLOYEE
      )
    ) {
      throw new NotFoundException('Staff user not found');
    }

    if (userId === currentAdminId && dto.role && dto.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You cannot remove your own ADMIN role');
    }

    const data: {
      name?: string;
      email?: string;
      phone?: string | null;
      role?: UserRole;
    } = {};

    if (dto.name !== undefined) {
      data.name = dto.name.trim();
    }

    if (dto.phone !== undefined) {
      data.phone = dto.phone.trim() || null;
    }

    if (dto.role !== undefined) {
      data.role = dto.role;
    }

    if (dto.email !== undefined) {
      const email = dto.email.trim().toLowerCase();

      if (email !== user.email) {
        const existingUser = await this.prisma.user.findUnique({
          where: { email },
        });

        if (existingUser) {
          throw new ConflictException('Email already registered');
        }
      }

      data.email = email;
    }

    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async setStaffActive(
    currentAdminId: string,
    userId: string,
    isActive: boolean,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (
      !user ||
      (
        user.role !== UserRole.ADMIN &&
        user.role !== UserRole.MANAGER &&
        user.role !== UserRole.EMPLOYEE
      )
    ) {
      throw new NotFoundException('Staff user not found');
    }

    if (userId === currentAdminId && !isActive) {
      throw new ForbiddenException('You cannot disable your own account');
    }

    if (!isActive && user.role === UserRole.ADMIN) {
      const activeAdmins = await this.prisma.user.count({
        where: {
          role: UserRole.ADMIN,
          isActive: true,
        },
      });

      if (activeAdmins <= 1) {
        throw new ForbiddenException(
          'At least one active ADMIN account must remain',
        );
      }
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { isActive },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async resetStaffPassword(userId: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (
      !user ||
      (
        user.role !== UserRole.ADMIN &&
        user.role !== UserRole.MANAGER &&
        user.role !== UserRole.EMPLOYEE
      )
    ) {
      throw new NotFoundException('Staff user not found');
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: passwordHash },
    });

    return { success: true };
  }
}
