import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(userId: string, dto: CreateOrderDto) {
    const service = await this.prisma.service.findFirst({
      where: {
        id: dto.serviceId,
        isActive: true,
      },
      include: {
        packages: {
          where: {
            isActive: true,
          },
        },
      },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    const isQuoteService = service.pricingType === 'QUOTE';

    if (isQuoteService) {
      const orderNo = await this.generateOrderNo();

      return this.prisma.$transaction(async (tx) => {
        const order = await tx.order.create({
          data: {
            orderNo,
            userId,
            serviceId: service.id,
            status: 'UNDER_REVIEW',
            unitPrice: 0,
            subtotal: 0,
            vat: 0,
            total: 0,
            customerNote: dto.customerNote?.trim(),
            formData: dto.formData as Prisma.InputJsonValue,
          },
          include: {
            service: true,
            package: true,
          },
        });

        await tx.orderHistory.create({
          data: {
            orderId: order.id,
            status: 'UNDER_REVIEW',
            note: 'تم استلام طلب عرض السعر',
            changedBy: userId,
          },
        });

        await this.notificationsService.createForOrderStatus(
          tx,
          order.userId,
          order.id,
          order.orderNo,
          OrderStatus.UNDER_REVIEW,
        );

        return order;
      });
    }

    // PER_DAY services (e.g. Advertising) use their configured daily
    // package automatically; the customer only provides the quantity/days.
    const selectedPackage =
      service.pricingType === 'PER_DAY'
        ? service.packages[0]
        : service.packages.find((item) => item.id === dto.packageId);

    if (!selectedPackage) {
      if (service.pricingType === 'PER_DAY') {
        throw new BadRequestException('Daily price is not configured');
      }

      if (!dto.packageId) {
        throw new BadRequestException('Package is required');
      }

      throw new BadRequestException(
        'Selected package does not belong to this service',
      );
    }

    const quantity = dto.quantity ?? 1;

    if (quantity < 1) {
      throw new BadRequestException('Quantity must be at least 1');
    }

    const unitPrice = Number(selectedPackage.price);
    const subtotal = unitPrice * quantity;
    const vat = 0;
    const total = subtotal + vat;
    const orderNo = await this.generateOrderNo();

    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          orderNo,
          userId,
          serviceId: service.id,
          packageId: selectedPackage.id,
          status: 'PENDING_PAYMENT',
          quantity,
          unitPrice,
          subtotal,
          vat,
          total,
          customerNote: dto.customerNote?.trim(),
          formData: dto.formData as Prisma.InputJsonValue,
        },
        include: {
          service: true,
          package: true,
        },
      });

      await tx.orderHistory.create({
        data: {
          orderId: order.id,
          status: 'PENDING_PAYMENT',
          note: 'تم إنشاء الطلب',
          changedBy: userId,
        },
      });

      await this.notificationsService.createForOrderStatus(
        tx,
        order.userId,
        order.id,
        order.orderNo,
        OrderStatus.PENDING_PAYMENT,
      );

      return order;
    });
  }

  async findAll(userId: string) {
    return this.prisma.order.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        service: true,
        package: true,
      },
    });
  }

  async findOne(userId: string, orderNo: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        orderNo,
        userId,
      },
      include: {
        service: true,
        package: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async findHistory(userId: string, orderNo: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        orderNo,
        userId,
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

  async updateStatus(
    userId: string,
    orderNo: string,
    status: OrderStatus,
    note?: string,
  ) {
    const order = await this.prisma.order.findFirst({
      where: {
        orderNo,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status === status) {
      throw new BadRequestException('Order is already in this status');
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
          service: true,
          package: true,
        },
      });

      await tx.orderHistory.create({
        data: {
          orderId: order.id,
          status,
          note: note?.trim() || null,
          changedBy: userId,
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

  async submitRevision(
    userId: string,
    orderNo: string,
    response: string,
    formData?: Record<string, unknown>,
  ) {
    const order = await this.prisma.order.findFirst({
      where: {
        orderNo,
        userId,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== OrderStatus.REVISION) {
      throw new BadRequestException(
        'Order is not waiting for a revision response',
      );
    }

    const trimmedResponse = response.trim();

    if (!trimmedResponse) {
      throw new BadRequestException('Revision response is required');
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: {
          id: order.id,
        },
        data: {
          status: OrderStatus.UNDER_REVIEW,
          formData: formData
            ? (formData as Prisma.InputJsonValue)
            : undefined,
        },
        include: {
          service: true,
          package: true,
        },
      });

      await tx.orderHistory.create({
        data: {
          orderId: order.id,
          status: OrderStatus.UNDER_REVIEW,
          note: `رد العميل على التعديل: ${trimmedResponse}`,
          changedBy: userId,
        },
      });

      await this.notificationsService.createForOrderStatus(
        tx,
        order.userId,
        order.id,
        order.orderNo,
        OrderStatus.UNDER_REVIEW,
      );

      return updatedOrder;
    });
  }

  private async generateOrderNo(): Promise<string> {
    for (;;) {
      const random = Math.floor(100000 + Math.random() * 900000);
      const orderNo = `DF-${new Date().getFullYear()}-${random}`;

      const existing = await this.prisma.order.findUnique({
        where: {
          orderNo,
        },
      });

      if (!existing) {
        return orderNo;
      }
    }
  }
}
