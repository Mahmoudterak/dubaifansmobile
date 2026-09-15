import { IsOptional, IsString, IsUrl } from 'class-validator';

export class CreatePaymentDto {
  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsUrl()
  successUrl?: string;

  @IsOptional()
  @IsUrl()
  cancelUrl?: string;

  @IsOptional()
  @IsUrl()
  failureUrl?: string;
}
