import { Controller, Get, Query } from '@nestjs/common';
import { MailsService } from './mails.service';
import { PaginationParamsDto } from './dto/pagination-params.dto';

@Controller('mails')
export class MailsController {
  constructor(private readonly mailsService: MailsService) {}

  @Get()
  getMails(@Query() query: PaginationParamsDto) {
    return this.mailsService.getMailPaginated(query);
  }
}
