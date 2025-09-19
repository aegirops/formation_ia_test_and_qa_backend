import { IMail } from '../../src/mails/interfaces/mail.interface';
import { IUser } from '../../src/mails/interfaces/user.interface';

/**
 * Test fixtures for mail-related tests
 */
export class MailFixtures {
  /**
   * Valid user fixture
   */
  static readonly validUser: IUser = {
    id: 1,
    name: 'John Doe',
    email: 'john.doe@example.com',
    avatar: {
      src: 'https://i.pravatar.cc/128?u=test',
    },
  };

  /**
   * Valid mail fixture
   */
  static readonly validMail: IMail = {
    id: 1,
    from: MailFixtures.validUser,
    subject: 'Test Email Subject',
    body: 'This is a test email body with some content for testing purposes.',
    date: new Date('2024-03-15T10:00:00.000Z').toISOString(),
    unread: false,
  };

  /**
   * Unread mail fixture
   */
  static readonly unreadMail: IMail = {
    ...MailFixtures.validMail,
    id: 2,
    unread: true,
    subject: 'Unread Test Email',
  };

  /**
   * Mail without optional fields
   */
  static readonly minimalMail: IMail = {
    id: 3,
    from: {
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
    },
    subject: 'Minimal Email',
    body: 'Minimal email content.',
    date: new Date('2024-03-14T15:30:00.000Z').toISOString(),
  };

  /**
   * Creates a mail with custom properties
   * @param overrides - Properties to override
   * @returns Customized mail object
   */
  static createMail(overrides: Partial<IMail> = {}): IMail {
    return {
      ...MailFixtures.validMail,
      ...overrides,
    };
  }

  /**
   * Creates multiple mails for testing pagination
   * @param count - Number of mails to create
   * @param baseId - Starting ID for the mails
   * @returns Array of mail objects
   */
  static createMails(count: number, baseId: number = 1000): IMail[] {
    const mails: IMail[] = [];

    for (let i = 0; i < count; i++) {
      mails.push({
        id: baseId + i,
        from: {
          name: `Test User ${i + 1}`,
          email: `testuser${i + 1}@example.com`,
          avatar: {
            src: `https://i.pravatar.cc/128?u=${baseId + i}`,
          },
        },
        subject: `Test Email ${i + 1}`,
        body: `This is test email number ${i + 1} with some content for testing pagination.`,
        date: new Date(Date.now() - i * 60000).toISOString(), // Each mail 1 minute apart
        unread: i % 3 === 0, // Every 3rd mail is unread
      });
    }

    return mails;
  }

  /**
   * Creates a user with custom properties
   * @param overrides - Properties to override
   * @returns Customized user object
   */
  static createUser(overrides: Partial<IUser> = {}): IUser {
    return {
      ...MailFixtures.validUser,
      ...overrides,
    };
  }

  /**
   * Test data for pagination scenarios
   */
  static readonly paginationTestData = {
    defaultTake: 10,
    defaultSkip: 0,
    testCases: [
      { take: '5', skip: '0', description: 'First 5 items' },
      { take: '5', skip: '5', description: 'Second 5 items' },
      { take: '10', skip: '0', description: 'First 10 items' },
      { take: '1', skip: '0', description: 'Single item' },
      { take: '100', skip: '0', description: 'Large take value' },
      { take: '5', skip: '1000', description: 'Large skip value' },
    ],
  };

  /**
   * Test data for validation scenarios
   */
  static readonly validationTestData = {
    invalidParameters: [
      { take: 'invalid', skip: '0' },
      { take: '5', skip: 'invalid' },
      { take: 'abc', skip: 'def' },
      { take: '', skip: '' },
      { take: 'null', skip: 'undefined' },
    ],
    edgeCaseParameters: [
      { take: '0', skip: '0' },
      { take: '-1', skip: '0' },
      { take: '5', skip: '-1' },
      { take: '5.5', skip: '2.7' },
      { take: '999999', skip: '999999' },
    ],
  };

  /**
   * Expected response structure for mails endpoint
   */
  static readonly expectedResponseStructure = {
    properties: ['mails', 'totalCount'],
    mailProperties: ['id', 'from', 'subject', 'body', 'date'],
    userProperties: ['name', 'email'],
    optionalMailProperties: ['unread'],
    optionalUserProperties: ['id', 'avatar', 'status', 'location'],
  };

  /**
   * Common error messages
   */
  static readonly errorMessages = {
    invalidTakeSkip: 'Invalid take, skip',
    invalidTake: 'take must be a valid number',
    invalidSkip: 'skip must be a valid number',
    negativeTake: 'Take must be a positive number (minimum 1)',
    zeroTake: 'Take must be a positive number (minimum 1)',
    negativeSkip: 'Skip must be a positive number or zero',
    internalServerError: 'Internal server error',
    badRequest: 'Bad Request',
  };

  /**
   * HTTP status codes for testing
   */
  static readonly httpStatusCodes = {
    success: 200,
    badRequest: 400,
    internalServerError: 500,
  };
}
