import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma.service';
import { NotificationsService } from '../../notifications/notifications.service';

@Injectable()
export class AdminOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async findAll(status?: OrderStatus, search?: string) {
    const where: Prisma.OrderWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (search?.trim()) {
      const value = search.trim();

      where.OR = [
        {
          orderNo: {
            contains: value,
            mode: 'insensitive',
          },
        },
        {
          user: {
            email: {
              contains: value,
              mode: 'insensitive',
            },
          },
        },
        {
          user: {
            name: {
              contains: value,
              mode: 'insensitive',
            },
          },
        },
        {
          user: {
            phone: {
              contains: value,
              mode: 'insensitive',
            },
          },
        },
      ];
    }

    return this.prisma.order.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            role: true,
          },
        },
        service: true,
        package: true,
      },
    });
  }

  async getStats() {
    const [
      total,
      pendingPayment,
      paid,
      underReview,
      inProgress,
      waitingForCustomer,
      revision,
      completed,
      cancelled,
      refunded,
      revenueResult,
    ] = await Promise.all([
      this.prisma.order.count(),

      this.prisma.order.count({
        where: { status: OrderStatus.PENDING_PAYMENT },
      }),

      this.prisma.order.count({
        where: { status: OrderStatus.PAID },
      }),

      this.prisma.order.count({
        where: { status: OrderStatus.UNDER_REVIEW },
      }),

      this.prisma.order.count({
        where: { status: OrderStatus.IN_PROGRESS },
      }),

      this.prisma.order.count({
        where: { status: OrderStatus.WAITING_FOR_CUSTOMER },
      }),

      this.prisma.order.count({
        where: { status: OrderStatus.REVISION },
      }),

      this.prisma.order.count({
        where: { status: OrderStatus.COMPLETED },
      }),

      this.prisma.order.count({
        where: { status: OrderStatus.CANCELLED },
      }),

      this.prisma.order.count({
        where: { status: OrderStatus.REFUNDED },
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
        },
      }),
    ]);

    return {
      total,
      pendingPayment,
      paid,
      underReview,
      inProgress,
      waitingForCustomer,
      revision,
      completed,
      cancelled,
      refunded,
      revenue: revenueResult._sum.total ?? 0,
    };
  }

  async findOne(orderNo: string) {
    const order = await this.prisma.order.findUnique({
      where: {
        orderNo,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            role: true,
          },
        },
        service: true,
        package: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async findHistory(orderNo: string) {
    const order = await this.prisma.order.findUnique({
      where: {
        orderNo,
      },
      select: {
        id: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return this.prisma.orderHistory.findMany({
      where: {
        orderId: order.id,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async updateCampaignData(
    orderNo: string,
    campaignData: Record<string, unknown>,
  ) {
    const order = await this.prisma.order.findUnique({
      where: {
        orderNo,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return this.prisma.order.update({
      where: {
        id: order.id,
      },
      data: {
        campaignData: campaignData as Prisma.InputJsonValue,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            role: true,
          },
        },
        service: true,
        package: true,
      },
    });
  }

  async updateStatus(
    adminUserId: string,
    orderNo: string,
    status: OrderStatus,
    note?: string,
  ) {
    const order = await this.prisma.order.findUnique({
      where: {
        orderNo,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status === status) {
      throw new BadRequestException(
        'Order is already in this status',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: {
          id: order.id,
        },
        data: {
          status,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              phone: true,
              role: true,
            },
          },
          service: true,
          package: true,
        },
      });

      await tx.orderHistory.create({
        data: {
          orderId: order.id,
          status,
          note: note?.trim() || null,
          changedBy: adminUserId,
        },
      });

      await this.notificationsService.createForOrderStatus(
        tx,
        order.userId,
        order.id,
        order.orderNo,
        status,
        note,
      );

      return updatedOrder;
    });
  }
}
