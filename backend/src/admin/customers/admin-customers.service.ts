import { Injectable } from '@nestjs/common';
import { OrderStatus, Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class AdminCustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(search?: string) {
    const where: Prisma.UserWhereInput = {
      role: UserRole.CUSTOMER,
    };

    if (search?.trim()) {
      const value = search.trim();

      where.OR = [
        {
          name: {
            contains: value,
            mode: 'insensitive',
          },
        },
        {
          email: {
            contains: value,
            mode: 'insensitive',
          },
        },
        {
          phone: {
            contains: value,
            mode: 'insensitive',
          },
        },
      ];
    }

    const users = await this.prisma.user.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
        orders: {
          orderBy: {
            createdAt: 'desc',
          },
          select: {
            id: true,
            orderNo: true,
            status: true,
            total: true,
            createdAt: true,
            service: {
              select: {
                name: true,
              },
            },
            package: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    return users.map((user) => {
      const validOrders = user.orders.filter(
        (order) =>
          order.status !== OrderStatus.CANCELLED &&
          order.status !== OrderStatus.REFUNDED,
      );

      const totalSpent = validOrders.reduce(
        (sum, order) => sum + Number(order.total),
        0,
      );

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        orderCount: user.orders.length,
        activeOrderCount: user.orders.filter(
          (order) =>
            order.status !== OrderStatus.COMPLETED &&
            order.status !== OrderStatus.CANCELLED &&
            order.status !== OrderStatus.REFUNDED,
        ).length,
        totalSpent,
        lastOrder: user.orders[0] || null,
      };
    });
  }

  async getStats() {
    const [totalCustomers, activeCustomers, ordersAggregate, orderCount] =
      await Promise.all([
        this.prisma.user.count({
          where: { role: UserRole.CUSTOMER },
        }),

        this.prisma.user.count({
          where: {
            role: UserRole.CUSTOMER,
            orders: {
              some: {
                status: {
                  notIn: [
                    OrderStatus.COMPLETED,
                    OrderStatus.CANCELLED,
                    OrderStatus.REFUNDED,
                  ],
                },
              },
            },
          },
        }),

        this.prisma.order.aggregate({
          _sum: {
            total: true,
          },
          where: {
            status: {
              notIn: [
                OrderStatus.CANCELLED,
                OrderStatus.REFUNDED,
              ],
            },
            user: {
              role: UserRole.CUSTOMER,
            },
          },
        }),

        this.prisma.order.count({
          where: {
            user: {
              role: UserRole.CUSTOMER,
            },
          },
        }),
      ]);

    return {
      totalCustomers,
      activeCustomers,
      orderCount,
      totalRevenue: ordersAggregate._sum.total ?? 0,
    };
  }
}
