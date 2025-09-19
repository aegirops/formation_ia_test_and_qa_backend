import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { MailsService } from './mails.service';
import { PaginationParamsDto } from './dto/pagination-params.dto';
import { GetMailsPaginatedResponseDto } from './dto/get-mails-response.dto';
import { mails } from './mails';

// Mock the mails data to have control over it during tests
jest.mock('./mails', () => ({
  mails: [
    {
      id: 1,
      from: {
        name: 'Test User 1',
        email: 'test1@example.com',
        avatar: { src: 'https://example.com/avatar1.jpg' },
      },
      subject: 'Test Subject 1',
      body: 'Test Body 1',
      date: '2024-01-01T00:00:00.000Z',
    },
    {
      id: 2,
      from: {
        name: 'Test User 2',
        email: 'test2@example.com',
        avatar: { src: 'https://example.com/avatar2.jpg' },
      },
      subject: 'Test Subject 2',
      body: 'Test Body 2',
      date: '2024-01-02T00:00:00.000Z',
      unread: true,
    },
    {
      id: 3,
      from: {
        name: 'Test User 3',
        email: 'test3@example.com',
      },
      subject: 'Test Subject 3',
      body: 'Test Body 3',
      date: '2024-01-03T00:00:00.000Z',
    },
  ],
}));

describe('MailsService', () => {
  let service: MailsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MailsService],
    }).compile();

    service = module.get<MailsService>(MailsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getMailPaginated', () => {
    describe('Success scenarios', () => {
      it('should return paginated mails with default pagination (take=10, skip=0)', () => {
        // PREPARE
        const query: PaginationParamsDto = {
          take: '10',
          skip: '0',
        };
        const expectedTotalCount = 3;
        const expectedMailsCount = 3; // All mails since we have only 3 in mock

        // CALL
        const result = service.getMailPaginated(query);

        // CONTROL
        expect(result).toBeInstanceOf(GetMailsPaginatedResponseDto);
        expect(result.mails).toHaveLength(expectedMailsCount);
        expect(result.totalCount).toBe(expectedTotalCount);
        expect(result.mails[0].id).toBe(1);
        expect(result.mails[1].id).toBe(2);
        expect(result.mails[2].id).toBe(3);
      });

      it('should return correct slice of mails with custom pagination (take=2, skip=1)', () => {
        // PREPARE
        const query: PaginationParamsDto = {
          take: '2',
          skip: '1',
        };
        const expectedTotalCount = 3;
        const expectedMailsCount = 2;

        // CALL
        const result = service.getMailPaginated(query);

        // CONTROL
        expect(result).toBeInstanceOf(GetMailsPaginatedResponseDto);
        expect(result.mails).toHaveLength(expectedMailsCount);
        expect(result.totalCount).toBe(expectedTotalCount);
        expect(result.mails[0].id).toBe(2); // Second mail (skip 1)
        expect(result.mails[1].id).toBe(3); // Third mail
      });

      it('should return single mail when take=1', () => {
        // PREPARE
        const query: PaginationParamsDto = {
          take: '1',
          skip: '0',
        };
        const expectedTotalCount = 3;
        const expectedMailsCount = 1;

        // CALL
        const result = service.getMailPaginated(query);

        // CONTROL
        expect(result).toBeInstanceOf(GetMailsPaginatedResponseDto);
        expect(result.mails).toHaveLength(expectedMailsCount);
        expect(result.totalCount).toBe(expectedTotalCount);
        expect(result.mails[0].id).toBe(1);
        expect(result.mails[0].subject).toBe('Test Subject 1');
      });

      it('should return empty array when skip exceeds total count', () => {
        // PREPARE
        const query: PaginationParamsDto = {
          take: '10',
          skip: '5', // Skip more than total mails (3)
        };
        const expectedTotalCount = 3;
        const expectedMailsCount = 0;

        // CALL
        const result = service.getMailPaginated(query);

        // CONTROL
        expect(result).toBeInstanceOf(GetMailsPaginatedResponseDto);
        expect(result.mails).toHaveLength(expectedMailsCount);
        expect(result.totalCount).toBe(expectedTotalCount);
        expect(result.mails).toEqual([]);
      });

      it('should return partial results when take exceeds remaining mails', () => {
        // PREPARE
        const query: PaginationParamsDto = {
          take: '10', // Request more than available
          skip: '2', // Skip 2, only 1 mail left
        };
        const expectedTotalCount = 3;
        const expectedMailsCount = 1;

        // CALL
        const result = service.getMailPaginated(query);

        // CONTROL
        expect(result).toBeInstanceOf(GetMailsPaginatedResponseDto);
        expect(result.mails).toHaveLength(expectedMailsCount);
        expect(result.totalCount).toBe(expectedTotalCount);
        expect(result.mails[0].id).toBe(3);
      });

      it('should handle zero values correctly', () => {
        // PREPARE
        const query: PaginationParamsDto = {
          take: '0',
          skip: '0',
        };
        const expectedTotalCount = 3;
        const expectedMailsCount = 0;

        // CALL
        const result = service.getMailPaginated(query);

        // CONTROL
        expect(result).toBeInstanceOf(GetMailsPaginatedResponseDto);
        expect(result.mails).toHaveLength(expectedMailsCount);
        expect(result.totalCount).toBe(expectedTotalCount);
        expect(result.mails).toEqual([]);
      });
    });

    describe('Invalid input scenarios (NaN behavior)', () => {
      it('should return empty array when take is not a valid number (becomes NaN)', () => {
        // PREPARE
        const query: PaginationParamsDto = {
          take: 'invalid',
          skip: '0',
        };
        const expectedTotalCount = 3;

        // CALL
        const result = service.getMailPaginated(query);

        // CONTROL
        expect(result).toBeInstanceOf(GetMailsPaginatedResponseDto);
        expect(result.mails).toHaveLength(0); // slice(0, NaN) returns []
        expect(result.totalCount).toBe(expectedTotalCount);
        expect(result.mails).toEqual([]);
      });

      it('should return empty array when both take and skip are invalid (both become NaN)', () => {
        // PREPARE
        const query: PaginationParamsDto = {
          take: 'invalid_take',
          skip: 'invalid_skip',
        };
        const expectedTotalCount = 3;

        // CALL
        const result = service.getMailPaginated(query);

        // CONTROL
        expect(result).toBeInstanceOf(GetMailsPaginatedResponseDto);
        expect(result.mails).toHaveLength(0); // slice(NaN, NaN) returns []
        expect(result.totalCount).toBe(expectedTotalCount);
        expect(result.mails).toEqual([]);
      });

      it('should return empty array when take is empty string (becomes NaN)', () => {
        // PREPARE
        const query: PaginationParamsDto = {
          take: '',
          skip: '0',
        };
        const expectedTotalCount = 3;

        // CALL
        const result = service.getMailPaginated(query);

        // CONTROL
        expect(result).toBeInstanceOf(GetMailsPaginatedResponseDto);
        expect(result.mails).toHaveLength(0); // slice(0, NaN) returns []
        expect(result.totalCount).toBe(expectedTotalCount);
        expect(result.mails).toEqual([]);
      });
    });

    describe('Edge cases', () => {
      it('should handle negative take value by parsing to negative number', () => {
        // PREPARE
        const query: PaginationParamsDto = {
          take: '-5',
          skip: '0',
        };
        const expectedTotalCount = 3;

        // CALL
        const result = service.getMailPaginated(query);

        // CONTROL
        expect(result).toBeInstanceOf(GetMailsPaginatedResponseDto);
        expect(result.totalCount).toBe(expectedTotalCount);
        // Negative take should result in empty array (slice behavior)
        expect(result.mails).toEqual([]);
      });

      it('should handle negative skip value by parsing to negative number', () => {
        // PREPARE
        const query: PaginationParamsDto = {
          take: '2',
          skip: '-1',
        };
        const expectedTotalCount = 3;

        // CALL
        const result = service.getMailPaginated(query);

        // CONTROL
        expect(result).toBeInstanceOf(GetMailsPaginatedResponseDto);
        expect(result.totalCount).toBe(expectedTotalCount);
        // slice(-1, -1+2) = slice(-1, 1) returns empty array
        expect(result.mails).toHaveLength(0);
        expect(result.mails).toEqual([]);
      });

      it('should handle very large take value', () => {
        // PREPARE
        const query: PaginationParamsDto = {
          take: '999999',
          skip: '0',
        };
        const expectedTotalCount = 3;
        const expectedMailsCount = 3; // All available mails

        // CALL
        const result = service.getMailPaginated(query);

        // CONTROL
        expect(result).toBeInstanceOf(GetMailsPaginatedResponseDto);
        expect(result.mails).toHaveLength(expectedMailsCount);
        expect(result.totalCount).toBe(expectedTotalCount);
      });

      it('should handle very large skip value', () => {
        // PREPARE
        const query: PaginationParamsDto = {
          take: '10',
          skip: '999999',
        };
        const expectedTotalCount = 3;
        const expectedMailsCount = 0;

        // CALL
        const result = service.getMailPaginated(query);

        // CONTROL
        expect(result).toBeInstanceOf(GetMailsPaginatedResponseDto);
        expect(result.mails).toHaveLength(expectedMailsCount);
        expect(result.totalCount).toBe(expectedTotalCount);
        expect(result.mails).toEqual([]);
      });

      it('should handle decimal numbers in take (parseInt should handle it)', () => {
        // PREPARE
        const query: PaginationParamsDto = {
          take: '2.5',
          skip: '1.7',
        };
        const expectedTotalCount = 3;
        const expectedMailsCount = 2; // parseInt('2.5') = 2

        // CALL
        const result = service.getMailPaginated(query);

        // CONTROL
        expect(result).toBeInstanceOf(GetMailsPaginatedResponseDto);
        expect(result.mails).toHaveLength(expectedMailsCount);
        expect(result.totalCount).toBe(expectedTotalCount);
        expect(result.mails[0].id).toBe(2); // parseInt('1.7') = 1, so skip 1
        expect(result.mails[1].id).toBe(3);
      });
    });

    describe('Data integrity', () => {
      it('should return mails with all required properties', () => {
        // PREPARE
        const query: PaginationParamsDto = {
          take: '1',
          skip: '0',
        };

        // CALL
        const result = service.getMailPaginated(query);

        // CONTROL
        expect(result.mails[0]).toHaveProperty('id');
        expect(result.mails[0]).toHaveProperty('from');
        expect(result.mails[0]).toHaveProperty('subject');
        expect(result.mails[0]).toHaveProperty('body');
        expect(result.mails[0]).toHaveProperty('date');
        expect(result.mails[0].from).toHaveProperty('name');
        expect(result.mails[0].from).toHaveProperty('email');
      });

      it('should return unread property when present', () => {
        // PREPARE
        const query: PaginationParamsDto = {
          take: '3',
          skip: '0',
        };

        // CALL
        const result = service.getMailPaginated(query);

        // CONTROL
        const unreadMail = result.mails.find((mail) => mail.id === 2);
        expect(unreadMail).toHaveProperty('unread', true);

        const readMail = result.mails.find((mail) => mail.id === 1);
        expect(readMail).not.toHaveProperty('unread');
      });

      it('should preserve mail order from original data', () => {
        // PREPARE
        const query: PaginationParamsDto = {
          take: '3',
          skip: '0',
        };

        // CALL
        const result = service.getMailPaginated(query);

        // CONTROL
        expect(result.mails[0].id).toBe(1);
        expect(result.mails[1].id).toBe(2);
        expect(result.mails[2].id).toBe(3);
      });
    });
  });
});
