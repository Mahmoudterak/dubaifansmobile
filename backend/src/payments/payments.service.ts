import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { OrderStatus, PaymentStatus, Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

interface ZiinaPaymentIntentResponse {
  id: string;
  amount: number;
  currency_code: string;
  status: string;
  operation_id: string;
  redirect_url?: string;
  embedded_url?: string;
  message?: string;
  latest_error?: unknown;
}

@Injectable()
export class PaymentsService {
  private readonly ziinaApiUrl = 'https://api-v2.ziina.com/api';

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async createPayment(
    userId: string,
    orderNo: string,
    dto: CreatePaymentDto,
  ) {
    const token = process.env.ZIINA_API_TOKEN;

    if (!token) {
      throw new UnauthorizedException('Ziina payment is not configured');
    }

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

    if (order.service.pricingType === 'QUOTE') {
      throw new BadRequestException(
        'Quote orders cannot be paid directly',
      );
    }

    if (order.status === OrderStatus.PAID) {
      throw new BadRequestException('Order is already paid');
    }

    if (order.status !== OrderStatus.PENDING_PAYMENT) {
      throw new BadRequestException(
        `Order cannot be paid in status ${order.status}`,
      );
    }

    const existingPayment = await this.prisma.payment.findFirst({
      where: {
        orderId: order.id,
        status: {
          in: [
            PaymentStatus.PENDING,
            PaymentStatus.REQUIRES_ACTION,
          ],
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (existingPayment) {
      return {
        success: true,
        payment: {
          id: existingPayment.id,
          paymentIntentId: existingPayment.paymentIntentId,
          status: existingPayment.status,
          redirectUrl: existingPayment.redirectUrl,
          embeddedUrl: existingPayment.embeddedUrl,
          amount: Number(existingPayment.amount),
          currency: existingPayment.currency,
        },
      };
    }

    const amountAed = Number(order.total);

    if (!Number.isFinite(amountAed) || amountAed <= 0) {
      throw new BadRequestException('Invalid order total');
    }

    const amountFils = Math.round(amountAed * 100);
    const operationId = randomUUID();

    const response = await fetch(
      `${this.ziinaApiUrl}/payment_intent`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          amount: amountFils,
          currency_code: 'AED',
          message:
            dto.message?.trim() ||
            `Dubai Fans order ${order.orderNo}`,
          success_url: dto.successUrl,
          cancel_url: dto.cancelUrl,
          failure_url: dto.failureUrl,
          operation_id: operationId,
        }),
      },
    );

    const responseText = await response.text();

    let ziinaData: ZiinaPaymentIntentResponse;

    try {
      ziinaData = JSON.parse(
        responseText,
      ) as ZiinaPaymentIntentResponse;
    } catch {
      throw new BadRequestException('Invalid response from Ziina');
    }

    if (!response.ok) {
      throw new BadRequestException(
        ziinaData.message ||
          (typeof ziinaData.latest_error === 'string'
            ? ziinaData.latest_error
            : 'Unable to create Ziina payment'),
      );
    }

    if (!ziinaData.id || !ziinaData.operation_id) {
      throw new BadRequestException(
        'Ziina payment response is missing required fields',
      );
    }

    const payment = await this.prisma.payment.create({
      data: {
        orderId: order.id,
        provider: 'ZIINA',
        paymentIntentId: ziinaData.id,
        operationId: ziinaData.operation_id,
        amount: new Prisma.Decimal(amountAed),
        currency: 'AED',
        status: this.mapZiinaStatus(ziinaData.status),
        redirectUrl: ziinaData.redirect_url ?? null,
        embeddedUrl: ziinaData.embedded_url ?? null,
      },
    });

    return {
      success: true,
      payment: {
        id: payment.id,
        paymentIntentId: payment.paymentIntentId,
        operationId: payment.operationId,
        status: payment.status,
        redirectUrl: payment.redirectUrl,
        embeddedUrl: payment.embeddedUrl,
        amount: Number(payment.amount),
        currency: payment.currency,
      },
    };
  }

  async getPaymentHistory(userId: string) {
    const payments = await this.prisma.payment.findMany({
      where: {
        order: {
          userId,
        },
      },
      include: {
        order: {
          include: {
            service: true,
            package: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return payments.map((payment) => ({
      id: payment.id,
      paymentIntentId: payment.paymentIntentId,
      operationId: payment.operationId,
      orderNo: payment.order.orderNo,
      serviceName: payment.order.service.name,
      packageName: payment.order.package?.name ?? null,
      amount: payment.amount.toString(),
      currency: payment.currency,
      status: payment.status,
      provider: payment.provider,
      createdAt: payment.createdAt,
      completedAt: payment.completedAt,
      failureMessage: payment.failureMessage,
    }));
  }

  async getPaymentStatus(userId: string, paymentIntentId: string) {
  const token = process.env.ZIINA_API_TOKEN;

  if (!token) {
    throw new UnauthorizedException('Ziina payment is not configured');
  }

  const payment = await this.prisma.payment.findFirst({
    where: {
      paymentIntentId,
      order: {
        userId,
      },
    },
    include: {
      order: true,
    },
  });

  if (!payment) {
    throw new NotFoundException('Payment not found');
  }

  const response = await fetch(
    `${this.ziinaApiUrl}/payment_intent/${paymentIntentId}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    },
  );

  const responseText = await response.text();

  let ziinaData: ZiinaPaymentIntentResponse;

  try {
    ziinaData = JSON.parse(
      responseText,
    ) as ZiinaPaymentIntentResponse;
  } catch {
    throw new BadRequestException('Invalid response from Ziina');
  }

  if (!response.ok) {
    throw new BadRequestException(
      ziinaData.message ||
        (typeof ziinaData.latest_error === 'string'
          ? ziinaData.latest_error
          : 'Unable to retrieve Ziina payment'),
    );
  }

  const mappedStatus = this.mapZiinaStatus(ziinaData.status);

  await this.prisma.$transaction(async (tx) => {
    if (payment.status !== mappedStatus) {
      await tx.payment.update({
        where: {
          id: payment.id,
        },
        data: {
          status: mappedStatus,
          completedAt:
            mappedStatus === PaymentStatus.COMPLETED
              ? payment.completedAt ?? new Date()
              : null,
          failureMessage:
            mappedStatus === PaymentStatus.FAILED
              ? typeof ziinaData.latest_error === 'string'
                ? ziinaData.latest_error
                : null
              : null,
        },
      });
    }

    if (
      mappedStatus === PaymentStatus.COMPLETED &&
      payment.order.status !== OrderStatus.PAID
    ) {
      await tx.order.update({
        where: {
          id: payment.order.id,
        },
        data: {
          status: OrderStatus.PAID,
        },
      });

      await tx.orderHistory.create({
        data: {
          orderId: payment.order.id,
          status: OrderStatus.PAID,
          note: 'تم تأكيد الدفع عبر Ziina',
          changedBy: null,
        },
      });

      await this.notificationsService.createForOrderStatus(
        tx,
        payment.order.userId,
        payment.order.id,
        payment.order.orderNo,
        OrderStatus.PAID,
      );
    }
  });

  return {
    success: true,
    payment: {
      id: payment.id,
      paymentIntentId: payment.paymentIntentId,
      status: mappedStatus,
      amount: Number(payment.amount),
      currency: payment.currency,
      orderNo: payment.order.orderNo,
    },
    ziina: {
      status: ziinaData.status,
      redirectUrl: ziinaData.redirect_url ?? null,
      embeddedUrl: ziinaData.embedded_url ?? null,
    },
  };
}
  async handleWebhook(body: Record<string, unknown>) {
    const eventType = body.event as string | undefined;
    const data =
      body.data && typeof body.data === 'object'
        ? (body.data as Record<string, unknown>)
        : body;

    const paymentIntentId =
      typeof data.id === 'string' ? data.id : undefined;

    const operationId =
      typeof data.operation_id === 'string'
        ? data.operation_id
        : undefined;

    const ziinaStatus =
      typeof data.status === 'string' ? data.status : undefined;

    if (!paymentIntentId && !operationId) {
      throw new BadRequestException(
        'Webhook is missing payment identifier',
      );
    }

    const payment = await this.prisma.payment.findFirst({
      where: paymentIntentId
        ? { paymentIntentId }
        : { operationId: operationId! },
      include: {
        order: true,
      },
    });

    if (!payment) {
      return {
        success: true,
        ignored: true,
        reason: 'Payment not found',
      };
    }

    if (!ziinaStatus) {
      return {
        success: true,
        ignored: true,
        reason: 'Payment status not provided',
      };
    }

    const mappedStatus = this.mapZiinaStatus(ziinaStatus);

    await this.prisma.$transaction(async (tx) => {
      const currentPayment = await tx.payment.findUnique({
        where: {
          id: payment.id,
        },
        include: {
          order: true,
        },
      });

      if (!currentPayment) {
        return;
      }

      const paymentUpdate: Prisma.PaymentUpdateInput = {
        status: mappedStatus,
      };

      if (mappedStatus === PaymentStatus.COMPLETED) {
        paymentUpdate.completedAt = new Date();
        paymentUpdate.failureMessage = null;
      }

      if (mappedStatus === PaymentStatus.FAILED) {
        const errorValue = data.latest_error;

        paymentUpdate.failureMessage =
          typeof errorValue === 'string'
            ? errorValue
            : 'Ziina payment failed';
      }

      await tx.payment.update({
        where: {
          id: currentPayment.id,
        },
        data: paymentUpdate,
      });

      if (
        mappedStatus === PaymentStatus.COMPLETED &&
        currentPayment.order.status === OrderStatus.PENDING_PAYMENT
      ) {
        await tx.order.update({
          where: {
            id: currentPayment.order.id,
          },
          data: {
            status: OrderStatus.PAID,
          },
        });

        await tx.orderHistory.create({
          data: {
            orderId: currentPayment.order.id,
            status: OrderStatus.PAID,
            note: eventType
              ? `تم تأكيد الدفع عبر Ziina (${eventType})`
              : 'تم تأكيد الدفع عبر Ziina',
            changedBy: null,
          },
        });

        await this.notificationsService.createForOrderStatus(
          tx,
          currentPayment.order.userId,
          currentPayment.order.id,
          currentPayment.order.orderNo,
          OrderStatus.PAID,
        );
      }
    });

    return {
      success: true,
      processed: true,
      paymentIntentId: payment.paymentIntentId,
      status: mappedStatus,
    };
  }

  private mapZiinaStatus(status: string): PaymentStatus {
    switch (status) {
      case 'requires_payment_instrument':
      case 'requires_user_action':
        return PaymentStatus.REQUIRES_ACTION;

      case 'pending':
        return PaymentStatus.PENDING;

      case 'completed':
        return PaymentStatus.COMPLETED;

      case 'failed':
        return PaymentStatus.FAILED;

      case 'canceled':
        return PaymentStatus.CANCELED;

      default:
        return PaymentStatus.PENDING;
    }
  }
}
