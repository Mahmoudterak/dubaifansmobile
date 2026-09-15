import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Roles } from '../../auth/roles.decorator';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { AdminCustomersService } from './admin-customers.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  UserRole.EMPLOYEE,
  UserRole.MANAGER,
  UserRole.ADMIN,
)
@Controller('admin/customers')
export class AdminCustomersController {
  constructor(
    private readonly adminCustomersService: AdminCustomersService,
  ) {}

  @Get()
  findAll(@Query('search') search?: string) {
    return this.adminCustomersService.findAll(search);
  }

  @Get('stats')
  getStats() {
    return this.adminCustomersService.getStats();
  }
}
