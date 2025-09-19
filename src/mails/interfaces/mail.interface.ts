import { IUser } from './user.interface';

export interface IMail {
  id?: number;
  unread?: boolean;
  from: IUser;
  subject: string;
  body: string;
  date: string;
}
