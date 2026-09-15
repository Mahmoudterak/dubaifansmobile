import { Controller, Get, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { AdminReportsService } from './admin-reports.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.EMPLOYEE, UserRole.MANAGER, UserRole.ADMIN)
@Controller('admin/reports')
export class AdminReportsController {
  constructor(
    private readonly adminReportsService: AdminReportsService,
  ) {}

  @Get('overview')
  getOverview() {
    return this.adminReportsService.getOverview();
  }
}
