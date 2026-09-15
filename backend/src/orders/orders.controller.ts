import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { SubmitOrderRevisionDto } from './dto/submit-order-revision.dto';
import { OrdersService } from './orders.service';

interface AuthenticatedRequest extends Request {
  user: {
    sub: string;
    email: string;
    role: UserRole;
  };
}

@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateOrderDto,
  ) {
    return this.ordersService.create(req.user.sub, dto);
  }

  @Get()
  findAll(@Req() req: AuthenticatedRequest) {
    return this.ordersService.findAll(req.user.sub);
  }

  @Get(':orderNo/history')
  findHistory(
    @Req() req: AuthenticatedRequest,
    @Param('orderNo') orderNo: string,
  ) {
    return this.ordersService.findHistory(req.user.sub, orderNo);
  }

  @Post(':orderNo/revision')
  submitRevision(
    @Req() req: AuthenticatedRequest,
    @Param('orderNo') orderNo: string,
    @Body() dto: SubmitOrderRevisionDto,
  ) {
    return this.ordersService.submitRevision(
      req.user.sub,
      orderNo,
      dto.response,
      dto.formData,
    );
  }

  @Patch(':orderNo/status')
  @UseGuards(RolesGuard)
  @Roles(
    UserRole.EMPLOYEE,
    UserRole.MANAGER,
    UserRole.ADMIN,
  )
  updateStatus(
    @Req() req: AuthenticatedRequest,
    @Param('orderNo') orderNo: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(
      req.user.sub,
      orderNo,
      dto.status,
      dto.note,
    );
  }

  @Get(':orderNo')
  findOne(
    @Req() req: AuthenticatedRequest,
    @Param('orderNo') orderNo: string,
  ) {
    return this.ordersService.findOne(req.user.sub, orderNo);
  }
}
