import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { mails } from './mails';
import { IGetMailsPaginated } from './interfaces/get-mails.interface';
import { IMail } from './interfaces/mail.interface';
import { GetMailsPaginatedResponseDto } from './dto/get-mails-response.dto';
import { plainToInstance } from 'class-transformer';
import { PaginationParamsDto } from './dto/pagination-params.dto';

@Injectable()
export class MailsService {
  constructor() {}

  private readonly logger = new Logger(MailsService.name);

  /**
   * @description Get mails from database paginated
   * @param take - Number of mails to get
   * @param skip - Number of mails to skip
   * @returns {GetMailsPaginatedResponseDto} Paginated response with mails and total count
   */
  getMailPaginated(query: PaginationParamsDto): GetMailsPaginatedResponseDto {
    let requestedMails: IMail[] = [];
    let totalCount: number = 0;
    let take = 10;
    let skip = 0;

    // Handle take, skip to number
    try {
      if (query.take !== undefined) {
        take = parseInt(query.take, 10);
        if (isNaN(take)) {
          throw new Error(`Invalid take parameter: ${query.take}`);
        }
        if (take <= 0) {
          throw new Error(
            `Take must be a positive number (minimum 1): ${take}`,
          );
        }
      }

      if (query.skip !== undefined) {
        skip = parseInt(query.skip, 10);
        if (isNaN(skip)) {
          throw new Error(`Invalid skip parameter: ${query.skip}`);
        }
        if (skip < 0) {
          throw new Error(`Skip must be a positive number or zero: ${skip}`);
        }
      }
    } catch (error) {
      this.logger.error(`Error parsing take, skip: ${error}`);
      throw new BadRequestException('Invalid take, skip');
    }

    // Get requested mails from database
    try {
      // Use mock instead of database
      requestedMails = mails.slice(skip, skip + take);

      // Count total number of mails
      totalCount = mails.length;
    } catch (error) {
      this.logger.error(`Error getting mails from database: ${error}`);
      throw new InternalServerErrorException(
        'Error getting mails from database',
      );
    }

    // Build and return response
    try {
      const responseDto = plainToInstance(GetMailsPaginatedResponseDto, {
        mails: requestedMails,
        totalCount,
      });
      return responseDto;
    } catch (error) {
      this.logger.error(`Error building response: ${error}`);
      throw new InternalServerErrorException('Error building response');
    }
  }
}
