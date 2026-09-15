import { Injectable } from '@nestjs/common';
import { OrderStatus, Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class AdminReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview() {
    const validOrderWhere: Prisma.OrderWhereInput = {
      status: {
        notIn: [OrderStatus.CANCELLED, OrderStatus.REFUNDED],
      },
    };

    const [
      totalOrders,
      completedOrders,
      activeOrders,
      totalCustomers,
      revenueAggregate,
      statusGroups,
      serviceGroups,
      recentOrders,
    ] = await Promise.all([
      this.prisma.order.count(),
      this.prisma.order.count({
        where: { status: OrderStatus.COMPLETED },
      }),
      this.prisma.order.count({
        where: {
          status: {
            notIn: [
              OrderStatus.COMPLETED,
              OrderStatus.CANCELLED,
              OrderStatus.REFUNDED,
            ],
          },
        },
      }),
      this.prisma.user.count({
        where: { role: UserRole.CUSTOMER },
      }),
      this.prisma.order.aggregate({
        _sum: { total: true },
        where: validOrderWhere,
      }),
      this.prisma.order.groupBy({
        by: ['status'],
        _count: { _all: true },
        _sum: { total: true },
        orderBy: {
          _count: {
            status: 'desc',
          },
        },
      }),
      this.prisma.order.groupBy({
        by: ['serviceId'],
        _count: { _all: true },
        _sum: { total: true },
        where: validOrderWhere,
        orderBy: {
          _count: {
            serviceId: 'desc',
          },
        },
      }),
      this.prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
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
      }),
    ]);

    const serviceIds = serviceGroups.map((item) => item.serviceId);

    const services = serviceIds.length
      ? await this.prisma.service.findMany({
          where: { id: { in: serviceIds } },
          select: {
            id: true,
            name: true,
          },
        })
      : [];

    const serviceMap = new Map(
      services.map((service) => [service.id, service.name]),
    );

    return {
      summary: {
        totalOrders,
        completedOrders,
        activeOrders,
        totalCustomers,
        totalRevenue: Number(revenueAggregate._sum.total ?? 0),
      },
      statuses: statusGroups.map((item) => ({
        status: item.status,
        count: item._count._all,
        revenue: Number(item._sum.total ?? 0),
      })),
      services: serviceGroups.map((item) => ({
        serviceId: item.serviceId,
        serviceName: serviceMap.get(item.serviceId) ?? 'Unknown',
        orderCount: item._count._all,
        revenue: Number(item._sum.total ?? 0),
      })),
      recentOrders,
    };
  }
}
