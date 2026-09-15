import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { UserRole } from '@prisma/client';

export const StaffUpdateRole = {
  ADMIN: UserRole.ADMIN,
  MANAGER: UserRole.MANAGER,
  EMPLOYEE: UserRole.EMPLOYEE,
} as const;

type StaffUpdateRole =
  (typeof StaffUpdateRole)[keyof typeof StaffUpdateRole];

export class UpdateStaffDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEnum(StaffUpdateRole)
  role?: StaffUpdateRole;
}
