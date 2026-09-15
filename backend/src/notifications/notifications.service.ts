import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.notification.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        order: {
          select: {
            orderNo: true,
            status: true,
          },
        },
      },
    });
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });

    return { count };
  }

  async createForOrderStatus(
    tx: Parameters<PrismaService['$transaction']>[0] extends never
      ? never
      : any,
    userId: string,
    orderId: string,
    orderNo: string,
    status: import('@prisma/client').OrderStatus,
    note?: string,
  ) {
    const messages: Record<
      import('@prisma/client').OrderStatus,
      { title: string; message: string }
    > = {
      DRAFT: {
        title: 'مسودة الطلب',
        message: `الطلب ${orderNo} في حالة مسودة.`,
      },
      PENDING_PAYMENT: {
        title: 'بانتظار الدفع',
        message: `الطلب ${orderNo} بانتظار إتمام الدفع.`,
      },
      PAID: {
        title: 'تم الدفع',
        message: `تم تأكيد دفع الطلب ${orderNo} بنجاح.`,
      },
      UNDER_REVIEW: {
        title: 'قيد المراجعة',
        message: `الطلب ${orderNo} قيد المراجعة.`,
      },
      IN_PROGRESS: {
        title: 'قيد التنفيذ',
        message: `بدأ تنفيذ الطلب ${orderNo}.`,
      },
      WAITING_FOR_CUSTOMER: {
        title: 'بانتظار رد من طرفكم',
        message: note?.trim()
          ? `نحتاج إلى ردكم بخصوص الطلب ${orderNo}: ${note.trim()}`
          : `الطلب ${orderNo} بانتظار رد من طرفكم.`,
      },
      REVISION: {
        title: 'تعديل مطلوب',
        message: note?.trim()
          ? `مطلوب تعديل على الطلب ${orderNo}: ${note.trim()}`
          : `مطلوب تعديل على الطلب ${orderNo}.`,
      },
      COMPLETED: {
        title: 'مكتمل',
        message: `تم إكمال الطلب ${orderNo} بنجاح.`,
      },
      CANCELLED: {
        title: 'ملغي',
        message: `تم إلغاء الطلب ${orderNo}.`,
      },
      REFUNDED: {
        title: 'مسترد',
        message: `تم استرداد مبلغ الطلب ${orderNo}.`,
      },
    };

    const content = messages[status];

    return tx.notification.create({
      data: {
        userId,
        orderId,
        title: content.title,
        message: content.message,
        status,
      },
    });
  }

  async markAsRead(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.isRead) {
      return notification;
    }

    return this.prisma.notification.update({
      where: {
        id: notification.id,
      },
      data: {
        isRead: true,
      },
    });
  }
}
