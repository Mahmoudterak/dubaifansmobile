import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsObject,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateOrderDto {
  @IsUUID()
  serviceId!: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  packageId?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  @IsOptional()
  @IsString()
  customerNote?: string;

  @IsOptional()
  @IsObject()
  formData?: Record<string, unknown>;
}
