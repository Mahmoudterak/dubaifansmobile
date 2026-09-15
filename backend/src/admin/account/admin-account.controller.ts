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
import { UserRole } from '@prisma/client';
import { Request } from 'express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { AdminAccountService } from './admin-account.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { ResetStaffPasswordDto } from './dto/reset-staff-password.dto';
import { SetStaffActiveDto } from './dto/set-staff-active.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';

interface AuthenticatedRequest extends Request {
  user: {
    sub: string;
    email: string;
    role: UserRole;
  };
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/account')
export class AdminAccountController {
  constructor(
    private readonly adminAccountService: AdminAccountService,
  ) {}

  @Get('users')
  findStaff() {
    return this.adminAccountService.findStaff();
  }

  @Post('users')
  createStaff(
    @Req() _req: AuthenticatedRequest,
    @Body() dto: CreateStaffDto,
  ) {
    return this.adminAccountService.createStaff(dto);
  }

  @Patch('users/:id')
  updateStaff(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateStaffDto,
  ) {
    return this.adminAccountService.updateStaff(
      req.user.sub,
      id,
      dto,
    );
  }

  @Patch('users/:id/active')
  setStaffActive(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: SetStaffActiveDto,
  ) {
    return this.adminAccountService.setStaffActive(
      req.user.sub,
      id,
      dto.isActive,
    );
  }

  @Patch('users/:id/password')
  resetStaffPassword(
    @Param('id') id: string,
    @Body() dto: ResetStaffPasswordDto,
  ) {
    return this.adminAccountService.resetStaffPassword(
      id,
      dto.password,
    );
  }
}
