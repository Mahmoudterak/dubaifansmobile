import { PrismaClient, PricingType, ServiceType } from '@prisma/client';

const prisma = new PrismaClient();

type SeedPackage = {
  slug: string;
  name: string;
  description?: string;
  price: number;
  unit: string;
  quantity: number;
  sortOrder: number;
};

type SeedService = {
  name: string;
  slug: string;
  description: string;
  type: ServiceType;
  pricingType: PricingType;
  icon: string;
  sortOrder: number;
  packages: SeedPackage[];
};

const services: SeedService[] = [
  {
    name: 'Advertising Management',
    slug: 'advertising',
    description: 'Professional advertising campaign management.',
    type: ServiceType.ADVERTISING,
    pricingType: PricingType.PER_DAY,
    icon: 'megaphone',
    sortOrder: 1,
    packages: [
      {
        slug: 'daily-management',
        name: 'Daily Management',
        description: 'Advertising campaign management per day.',
        price: 80,
        unit: 'day',
        quantity: 1,
        sortOrder: 1,
      },
    ],
  },
  {
    name: 'Followers',
    slug: 'followers',
    description: 'Social media follower growth packages.',
    type: ServiceType.FOLLOWERS,
    pricingType: PricingType.PACKAGE,
    icon: 'users',
    sortOrder: 2,
    packages: [
      {
        slug: '1000-followers',
        name: '1,000 Followers',
        price: 30,
        unit: 'followers',
        quantity: 1000,
        sortOrder: 1,
      },
      {
        slug: '5000-followers',
        name: '5,000 Followers',
        price: 150,
        unit: 'followers',
        quantity: 5000,
        sortOrder: 2,
      },
      {
        slug: '10000-followers',
        name: '10,000 Followers',
        price: 249,
        unit: 'followers',
        quantity: 10000,
        sortOrder: 3,
      },
      {
        slug: '25000-followers',
        name: '25,000 Followers',
        price: 399,
        unit: 'followers',
        quantity: 25000,
        sortOrder: 4,
      },
    ],
  },
  {
    name: 'Views & Likes',
    slug: 'views-likes',
    description: 'Views and likes growth packages.',
    type: ServiceType.VIEWS_LIKES,
    pricingType: PricingType.PACKAGE,
    icon: 'eye',
    sortOrder: 3,
    packages: [
      {
        slug: '10000-views-500-likes',
        name: '10,000 Views + 500 Likes',
        price: 29,
        unit: 'views_likes',
        quantity: 10000,
        sortOrder: 1,
      },
      {
        slug: '50000-views-2000-likes',
        name: '50,000 Views + 2,000 Likes',
        price: 99,
        unit: 'views_likes',
        quantity: 50000,
        sortOrder: 2,
      },
    ],
  },
  {
    name: 'Website',
    slug: 'website',
    description: 'Professional business website from a selected template.',
    type: ServiceType.WEBSITE,
    pricingType: PricingType.FIXED,
    icon: 'globe',
    sortOrder: 4,
    packages: [
      {
        slug: 'business-website',
        name: 'Business Website',
        price: 599,
        unit: 'website',
        quantity: 1,
        sortOrder: 1,
      },
    ],
  },
  {
    name: 'E-commerce Store',
    slug: 'ecommerce',
    description: 'Professional online store from a selected template.',
    type: ServiceType.ECOMMERCE,
    pricingType: PricingType.FIXED,
    icon: 'shopping-cart',
    sortOrder: 5,
    packages: [
      {
        slug: 'ecommerce-store',
        name: 'E-commerce Store',
        price: 799,
        unit: 'store',
        quantity: 1,
        sortOrder: 1,
      },
    ],
  },
  {
    name: 'SEO & Google',
    slug: 'seo-google',
    description: 'SEO and Google visibility improvement service.',
    type: ServiceType.SEO_GOOGLE,
    pricingType: PricingType.FIXED,
    icon: 'search',
    sortOrder: 6,
    packages: [
      {
        slug: 'seo-google',
        name: 'SEO & Google',
        price: 2999,
        unit: 'service',
        quantity: 1,
        sortOrder: 1,
      },
    ],
  },
  {
    name: 'Social Media Management',
    slug: 'social-media',
    description: 'Professional social media management.',
    type: ServiceType.SOCIAL_MEDIA,
    pricingType: PricingType.QUOTE,
    icon: 'share',
    sortOrder: 7,
    packages: [],
  },
  {
    name: 'Photography & Content',
    slug: 'photography',
    description: 'Professional photography and short-form video content.',
    type: ServiceType.PHOTOGRAPHY,
    pricingType: PricingType.PACKAGE,
    icon: 'camera',
    sortOrder: 8,
    packages: [
      {
        slug: '10-reels',
        name: '10 Reels',
        description: 'Professional production of 10 Reels.',
        price: 2999,
        unit: 'reels',
        quantity: 10,
        sortOrder: 1,
      },
    ],
  },
  {
    name: 'Custom Service',
    slug: 'custom',
    description: 'Request a custom service and receive a quotation.',
    type: ServiceType.CUSTOM,
    pricingType: PricingType.QUOTE,
    icon: 'briefcase',
    sortOrder: 9,
    packages: [],
  },
];

async function main() {
  for (const serviceData of services) {
    const service = await prisma.service.upsert({
      where: {
        slug: serviceData.slug,
      },
      update: {
        name: serviceData.name,
        description: serviceData.description,
        type: serviceData.type,
        pricingType: serviceData.pricingType,
        icon: serviceData.icon,
        isActive: true,
        sortOrder: serviceData.sortOrder,
      },
      create: {
        name: serviceData.name,
        slug: serviceData.slug,
        description: serviceData.description,
        type: serviceData.type,
        pricingType: serviceData.pricingType,
        icon: serviceData.icon,
        sortOrder: serviceData.sortOrder,
      },
    });

    for (const packageData of serviceData.packages) {
      await prisma.servicePackage.upsert({
        where: {
          serviceId_slug: {
            serviceId: service.id,
            slug: packageData.slug,
          },
        },
        update: {
          name: packageData.name,
          description: packageData.description ?? null,
          price: packageData.price,
          unit: packageData.unit,
          quantity: packageData.quantity,
          isActive: true,
          sortOrder: packageData.sortOrder,
        },
        create: {
          serviceId: service.id,
          slug: packageData.slug,
          name: packageData.name,
          description: packageData.description ?? null,
          price: packageData.price,
          unit: packageData.unit,
          quantity: packageData.quantity,
          sortOrder: packageData.sortOrder,
        },
      });
    }

    console.log(`Seeded: ${service.name}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
