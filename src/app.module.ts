import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MailsController } from './mails/mails.controller';
import { MailsService } from './mails/mails.service';
import { MailsModule } from './mails/mails.module';

@Module({
  imports: [MailsModule],
  controllers: [AppController, MailsController],
  providers: [AppService, MailsService],
})
export class AppModule {}
