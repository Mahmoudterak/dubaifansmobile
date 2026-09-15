import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AdminOrdersController } from './orders/admin-orders.controller';
import { AdminOrdersService } from './orders/admin-orders.service';
import { AdminServicesController } from './services/admin-services.controller';
import { AdminServicesService } from './services/admin-services.service';
import { AdminCustomersController } from './customers/admin-customers.controller';
import { AdminCustomersService } from './customers/admin-customers.service';
import { AdminReportsController } from './reports/admin-reports.controller';
import { AdminReportsService } from './reports/admin-reports.service';
import { AdminAccountController } from './account/admin-account.controller';
import { AdminAccountService } from './account/admin-account.service';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    NotificationsModule,
  ],
  controllers: [
    AdminOrdersController,
    AdminServicesController,
    AdminCustomersController,
    AdminReportsController,
    AdminAccountController,
  ],
  providers: [
    AdminOrdersService,
    AdminServicesService,
    AdminCustomersService,
    AdminReportsService,
    AdminAccountService,
  ],
})
export class AdminModule {}
