import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { OrderStatus, UserRole } from '@prisma/client';
import { Request } from 'express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Roles } from '../../auth/roles.decorator';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { UpdateOrderStatusDto } from '../../orders/dto/update-order-status.dto';
import { UpdateCampaignDataDto } from './dto/update-campaign-data.dto';
import { AdminOrdersService } from './admin-orders.service';

interface AuthenticatedRequest extends Request {
  user: {
    sub: string;
    email: string;
    role: UserRole;
  };
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  UserRole.EMPLOYEE,
  UserRole.MANAGER,
  UserRole.ADMIN,
)
@Controller('admin/orders')
export class AdminOrdersController {
  constructor(
    private readonly adminOrdersService: AdminOrdersService,
  ) {}

  @Get()
  findAll(
    @Query('status') status?: OrderStatus,
    @Query('search') search?: string,
  ) {
    return this.adminOrdersService.findAll(status, search);
  }

  @Get('stats')
  getStats() {
    return this.adminOrdersService.getStats();
  }

  @Get(':orderNo/history')
  findHistory(
    @Param('orderNo') orderNo: string,
  ) {
    return this.adminOrdersService.findHistory(orderNo);
  }

  @Get(':orderNo')
  findOne(
    @Param('orderNo') orderNo: string,
  ) {
    return this.adminOrdersService.findOne(orderNo);
  }

  @Patch(':orderNo/campaign-data')
  updateCampaignData(
    @Param('orderNo') orderNo: string,
    @Body() dto: UpdateCampaignDataDto,
  ) {
    return this.adminOrdersService.updateCampaignData(
      orderNo,
      dto as Record<string, unknown>,
    );
  }

  @Patch(':orderNo/status')
  updateStatus(
    @Req() req: AuthenticatedRequest,
    @Param('orderNo') orderNo: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.adminOrdersService.updateStatus(
      req.user.sub,
      orderNo,
      dto.status,
      dto.note,
    );
  }
}
