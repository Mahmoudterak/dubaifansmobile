import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  RawBodyRequest,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { createHmac, timingSafeEqual } from 'crypto';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentsService } from './payments.service';

interface AuthenticatedRequest extends Request {
  user: {
    sub: string;
    email: string;
    role: UserRole;
  };
}

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('orders/:orderNo')
  createPayment(
    @Req() req: AuthenticatedRequest,
    @Param('orderNo') orderNo: string,
    @Body() dto: CreatePaymentDto,
  ) {
    return this.paymentsService.createPayment(
      req.user.sub,
      orderNo,
      dto,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('history')
  getPaymentHistory(@Req() req: AuthenticatedRequest) {
    return this.paymentsService.getPaymentHistory(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':paymentIntentId')
  getPaymentStatus(
    @Req() req: AuthenticatedRequest,
    @Param('paymentIntentId') paymentIntentId: string,
  ) {
    return this.paymentsService.getPaymentStatus(
      req.user.sub,
      paymentIntentId,
    );
  }

  @Post('webhook')
  async webhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-hmac-signature') signature: string | undefined,
    @Body() body: Record<string, unknown>,
  ) {
    const secret = process.env.ZIINA_WEBHOOK_SECRET;

    if (!secret || !signature) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    const rawBody = req.rawBody;

    if (!rawBody) {
      throw new UnauthorizedException('Raw request body is unavailable');
    }

    const expected = createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    const providedBuffer = Buffer.from(signature, 'utf8');
    const expectedBuffer = Buffer.from(expected, 'utf8');

    if (
      providedBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(providedBuffer, expectedBuffer)
    ) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    return this.paymentsService.handleWebhook(body);
  }
}
