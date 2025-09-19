import { INestApplication } from '@nestjs/common';
import { MailsService } from '../../src/mails/mails.service';
import { IMail } from '../../src/mails/interfaces/mail.interface';

/**
 * Helper class for e2e tests
 */
export class TestHelpers {
  /**
   * Validates the structure of a paginated mails response
   * @param response - The response object to validate
   */
  static expectPaginatedMailsResponse(response: any): void {
    expect(response.body).toHaveProperty('mails');
    expect(response.body).toHaveProperty('totalCount');
    expect(Array.isArray(response.body.mails)).toBe(true);
    expect(typeof response.body.totalCount).toBe('number');
    expect(response.body.totalCount).toBeGreaterThanOrEqual(0);
  }

  /**
   * Validates the structure of a single mail object
   * @param mail - The mail object to validate
   */
  static expectValidMailStructure(mail: IMail): void {
    expect(mail).toHaveProperty('id');
    expect(mail).toHaveProperty('from');
    expect(mail).toHaveProperty('subject');
    expect(mail).toHaveProperty('body');
    expect(mail).toHaveProperty('date');

    // Validate from user structure
    expect(mail.from).toHaveProperty('name');
    expect(mail.from).toHaveProperty('email');

    // Validate data types
    expect(typeof mail.id).toBe('number');
    expect(typeof mail.subject).toBe('string');
    expect(typeof mail.body).toBe('string');
    expect(typeof mail.date).toBe('string');
    expect(typeof mail.from.name).toBe('string');
    expect(typeof mail.from.email).toBe('string');

    // Validate email format
    expect(mail.from.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);

    // Validate date format (ISO string)
    expect(() => new Date(mail.date)).not.toThrow();
    expect(new Date(mail.date).toISOString()).toBe(mail.date);

    // Validate optional unread field if present
    if (mail.hasOwnProperty('unread')) {
      expect(typeof mail.unread).toBe('boolean');
    }
  }

  /**
   * Validates all mails in a response array
   * @param mails - Array of mail objects to validate
   */
  static expectValidMailsArray(mails: IMail[]): void {
    expect(Array.isArray(mails)).toBe(true);
    mails.forEach((mail) => {
      TestHelpers.expectValidMailStructure(mail);
    });
  }

  /**
   * Validates that mail IDs are unique in an array
   * @param mails - Array of mail objects to check
   */
  static expectUniqueMailIds(mails: IMail[]): void {
    const ids = mails.map((mail) => mail.id);
    const uniqueIds = [...new Set(ids)];
    expect(uniqueIds.length).toBe(ids.length);
  }

  /**
   * Creates test parameters for pagination testing
   * @returns Array of test parameter objects
   */
  static getPaginationTestCases(): Array<{
    take?: string;
    skip?: string;
    description: string;
  }> {
    return [
      { description: 'default parameters (no query)' },
      { take: '5', description: 'custom take parameter' },
      { skip: '2', description: 'custom skip parameter' },
      { take: '3', skip: '5', description: 'both take and skip parameters' },
      { skip: '0', description: 'zero skip parameter' },
      { take: '100', description: 'large take parameter' },
      { skip: '1000', description: 'large skip parameter' },
    ];
  }

  /**
   * Creates test parameters for validation testing
   * @returns Array of invalid parameter test cases
   */
  static getValidationTestCases(): Array<{
    take?: string;
    skip?: string;
    description: string;
    expectedStatus: number;
  }> {
    return [
      {
        take: 'invalid',
        description: 'invalid take parameter (non-numeric)',
        expectedStatus: 400,
      },
      {
        skip: 'invalid',
        description: 'invalid skip parameter (non-numeric)',
        expectedStatus: 400,
      },
      {
        take: 'invalid',
        skip: 'invalid',
        description: 'both invalid parameters',
        expectedStatus: 400,
      },
      {
        take: '0',
        description: 'zero take parameter',
        expectedStatus: 400,
      },
      {
        take: '-1',
        description: 'negative take parameter',
        expectedStatus: 400,
      },
      {
        skip: '-1',
        description: 'negative skip parameter',
        expectedStatus: 400,
      },
      {
        take: '5.5',
        description: 'decimal take parameter',
        expectedStatus: 200,
      },
      {
        skip: '2.7',
        description: 'decimal skip parameter',
        expectedStatus: 200,
      },
    ];
  }

  /**
   * Builds query string from parameters
   * @param params - Object with take and/or skip parameters
   * @returns Query string
   */
  static buildQueryString(params: { take?: string; skip?: string }): string {
    const queryParts: string[] = [];
    if (params.take) queryParts.push(`take=${params.take}`);
    if (params.skip) queryParts.push(`skip=${params.skip}`);
    return queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
  }

  /**
   * Gets the MailsService instance from the NestJS application
   * @param app - The NestJS application instance
   * @returns MailsService instance
   */
  static getMailsService(app: INestApplication): MailsService {
    return app.get<MailsService>(MailsService);
  }

  /**
   * Validates that pagination results are consistent
   * @param response1 - First response to compare
   * @param response2 - Second response to compare
   */
  static expectConsistentTotalCount(response1: any, response2: any): void {
    expect(response1.body.totalCount).toBe(response2.body.totalCount);
  }

  /**
   * Validates that the response respects the take limit
   * @param response - The response to validate
   * @param expectedMaxLength - Maximum expected array length
   */
  static expectRespectsTakeLimit(
    response: any,
    expectedMaxLength: number,
  ): void {
    expect(response.body.mails.length).toBeLessThanOrEqual(expectedMaxLength);
    expect(response.body.mails.length).toBeLessThanOrEqual(
      response.body.totalCount,
    );
  }

  /**
   * Waits for a specified amount of time (for async operations)
   * @param ms - Milliseconds to wait
   */
  static async wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Creates a mock mail object for testing purposes
   * @param overrides - Properties to override in the mock mail
   * @returns Mock mail object
   */
  static createMockMail(overrides: Partial<IMail> = {}): IMail {
    return {
      id: 999,
      from: {
        name: 'Test User',
        email: 'test@example.com',
      },
      subject: 'Test Subject',
      body: 'Test body content',
      date: new Date().toISOString(),
      ...overrides,
    };
  }
}

/**
 * Common expectations for HTTP responses
 */
export class ResponseHelpers {
  /**
   * Expects a successful JSON response
   * @param response - The response to validate
   */
  static expectSuccessfulJsonResponse(response: any): void {
    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/json/);
  }

  /**
   * Expects a bad request response
   * @param response - The response to validate
   */
  static expectBadRequestResponse(response: any): void {
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message');
  }

  /**
   * Expects an internal server error response
   * @param response - The response to validate
   */
  static expectInternalServerErrorResponse(response: any): void {
    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty('message');
  }
}
