import { IsOptional, IsNumberString } from 'class-validator';

export class PaginationParamsDto {
  @IsOptional()
  @IsNumberString({}, { message: 'take must be a valid number' })
  take?: string;

  @IsOptional()
  @IsNumberString({}, { message: 'skip must be a valid number' })
  skip?: string;
}
