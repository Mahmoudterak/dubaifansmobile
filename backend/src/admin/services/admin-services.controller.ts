import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Roles } from '../../auth/roles.decorator';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { AdminServicesService } from './admin-services.service';
import {
  CreatePackageDto,
  CreateServiceDto,
  UpdatePackageDto,
  UpdateServiceDto,
} from './dto/admin-service.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.EMPLOYEE, UserRole.MANAGER, UserRole.ADMIN)
@Controller('admin/services')
export class AdminServicesController {
  constructor(
    private readonly adminServicesService: AdminServicesService,
  ) {}

  @Get()
  findAll(@Query('includeInactive') includeInactive?: string) {
    return this.adminServicesService.findAll(includeInactive !== 'false');
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.adminServicesService.findOne(id);
  }

  @Post()
  createService(@Body() dto: CreateServiceDto) {
    return this.adminServicesService.createService(dto);
  }

  @Patch(':id')
  updateService(
    @Param('id') id: string,
    @Body() dto: UpdateServiceDto,
  ) {
    return this.adminServicesService.updateService(id, dto);
  }

  @Patch(':id/active')
  setServiceActive(
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
  ) {
    return this.adminServicesService.setServiceActive(id, isActive);
  }

  @Post(':id/packages')
  createPackage(
    @Param('id') serviceId: string,
    @Body() dto: CreatePackageDto,
  ) {
    return this.adminServicesService.createPackage(serviceId, dto);
  }

  @Patch('packages/:packageId')
  updatePackage(
    @Param('packageId') packageId: string,
    @Body() dto: UpdatePackageDto,
  ) {
    return this.adminServicesService.updatePackage(packageId, dto);
  }

  @Patch('packages/:packageId/active')
  setPackageActive(
    @Param('packageId') packageId: string,
    @Body('isActive') isActive: boolean,
  ) {
    return this.adminServicesService.setPackageActive(
      packageId,
      isActive,
    );
  }
}
