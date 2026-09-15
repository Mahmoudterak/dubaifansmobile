import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { UserRole } from '@prisma/client';

export const StaffRole = {
  ADMIN: UserRole.ADMIN,
  MANAGER: UserRole.MANAGER,
  EMPLOYEE: UserRole.EMPLOYEE,
} as const;

type StaffRole = (typeof StaffRole)[keyof typeof StaffRole];

export class CreateStaffDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsEnum(StaffRole)
  role!: StaffRole;
}
