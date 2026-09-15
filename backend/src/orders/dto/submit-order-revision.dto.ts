import {
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class SubmitOrderRevisionDto {
  @IsString()
  @IsNotEmpty()
  response!: string;

  @IsOptional()
  @IsObject()
  formData?: Record<string, unknown>;
}
