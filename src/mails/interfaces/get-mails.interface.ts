import { IMail } from './mail.interface';

export interface IGetMailsPaginated {
  mails: IMail[];
  totalCount: number;
}
