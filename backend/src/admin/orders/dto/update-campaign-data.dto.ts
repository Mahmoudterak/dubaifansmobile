import {
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateCampaignDataDto {
  @IsOptional()
  @IsString()
  campaignName?: string;

  @IsOptional()
  @IsString()
  platform?: string;

  @IsOptional()
  @IsString()
  campaignUrl?: string;

  @IsOptional()
  @IsNumber()
  budget?: number;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsString()
  result?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
