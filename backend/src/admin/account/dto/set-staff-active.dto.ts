import { IsBoolean } from 'class-validator';

export class SetStaffActiveDto {
  @IsBoolean()
  isActive!: boolean;
}
