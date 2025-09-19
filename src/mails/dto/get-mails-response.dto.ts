import { IMail } from '../interfaces/mail.interface';

export class GetMailsPaginatedResponseDto {
  mails: IMail[];
  totalCount: number;
}
