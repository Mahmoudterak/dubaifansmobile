import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, PricingType, ServiceType } from '@prisma/client';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class AdminServicesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(includeInactive = true) {
    return this.prisma.service.findMany({
      where: includeInactive ? undefined : { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        packages: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  }

  async findOne(id: string) {
    const service = await this.prisma.service.findUnique({
      where: { id },
      include: {
        packages: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    return service;
  }

  async createService(data: {
    name: string;
    slug: string;
    description?: string;
    type: ServiceType;
    pricingType: PricingType;
    icon?: string;
    isActive?: boolean;
    sortOrder?: number;
  }) {
    const existing = await this.prisma.service.findUnique({
      where: { slug: data.slug },
    });

    if (existing) {
      throw new BadRequestException('Service slug already exists');
    }

    return this.prisma.service.create({
      data: {
        name: data.name.trim(),
        slug: data.slug.trim(),
        description: data.description?.trim() || null,
        type: data.type,
        pricingType: data.pricingType,
        icon: data.icon?.trim() || null,
        isActive: data.isActive ?? true,
        sortOrder: data.sortOrder ?? 0,
      },
      include: {
        packages: true,
      },
    });
  }

  async updateService(
    id: string,
    data: {
      name?: string;
      slug?: string;
      description?: string | null;
      type?: ServiceType;
      pricingType?: PricingType;
      icon?: string | null;
      isActive?: boolean;
      sortOrder?: number;
    },
  ) {
    await this.findOne(id);

    if (data.slug) {
      const existing = await this.prisma.service.findFirst({
        where: {
          slug: data.slug.trim(),
          NOT: { id },
        },
      });

      if (existing) {
        throw new BadRequestException('Service slug already exists');
      }
    }

    return this.prisma.service.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name.trim() }),
        ...(data.slug !== undefined && { slug: data.slug.trim() }),
        ...(data.description !== undefined && {
          description: data.description?.trim() || null,
        }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.pricingType !== undefined && {
          pricingType: data.pricingType,
        }),
        ...(data.icon !== undefined && {
          icon: data.icon?.trim() || null,
        }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
      },
      include: {
        packages: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  }

  async setServiceActive(id: string, isActive: boolean) {
    await this.findOne(id);

    return this.prisma.service.update({
      where: { id },
      data: { isActive },
      include: {
        packages: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  }

  async createPackage(
    serviceId: string,
    data: {
      slug: string;
      name: string;
      description?: string;
      price: number;
      unit?: string;
      quantity?: number;
      isActive?: boolean;
      sortOrder?: number;
    },
  ) {
    await this.findOne(serviceId);

    const existing = await this.prisma.servicePackage.findFirst({
      where: {
        serviceId,
        slug: data.slug.trim(),
      },
    });

    if (existing) {
      throw new BadRequestException('Package slug already exists for this service');
    }

    return this.prisma.servicePackage.create({
      data: {
        serviceId,
        slug: data.slug.trim(),
        name: data.name.trim(),
        description: data.description?.trim() || null,
        price: new Prisma.Decimal(data.price),
        unit: data.unit?.trim() || null,
        quantity: data.quantity ?? null,
        isActive: data.isActive ?? true,
        sortOrder: data.sortOrder ?? 0,
      },
    });
  }

  async updatePackage(
    packageId: string,
    data: {
      slug?: string;
      name?: string;
      description?: string | null;
      price?: number;
      unit?: string | null;
      quantity?: number | null;
      isActive?: boolean;
      sortOrder?: number;
    },
  ) {
    const existingPackage = await this.prisma.servicePackage.findUnique({
      where: { id: packageId },
    });

    if (!existingPackage) {
      throw new NotFoundException('Package not found');
    }

    if (data.slug) {
      const duplicate = await this.prisma.servicePackage.findFirst({
        where: {
          serviceId: existingPackage.serviceId,
          slug: data.slug.trim(),
          NOT: { id: packageId },
        },
      });

      if (duplicate) {
        throw new BadRequestException('Package slug already exists for this service');
      }
    }

    return this.prisma.servicePackage.update({
      where: { id: packageId },
      data: {
        ...(data.slug !== undefined && { slug: data.slug.trim() }),
        ...(data.name !== undefined && { name: data.name.trim() }),
        ...(data.description !== undefined && {
          description: data.description?.trim() || null,
        }),
        ...(data.price !== undefined && {
          price: new Prisma.Decimal(data.price),
        }),
        ...(data.unit !== undefined && {
          unit: data.unit?.trim() || null,
        }),
        ...(data.quantity !== undefined && {
          quantity: data.quantity,
        }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
      },
    });
  }

  async setPackageActive(packageId: string, isActive: boolean) {
    const existingPackage = await this.prisma.servicePackage.findUnique({
      where: { id: packageId },
    });

    if (!existingPackage) {
      throw new NotFoundException('Package not found');
    }

    return this.prisma.servicePackage.update({
      where: { id: packageId },
      data: { isActive },
    });
  }
}
