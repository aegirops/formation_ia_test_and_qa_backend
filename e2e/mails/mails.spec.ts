import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { MailsService } from '../../src/mails/mails.service';
import { TestHelpers, ResponseHelpers } from '../helpers/test-helpers';
import { MailFixtures } from '../fixtures/mail.fixtures';

describe('Mails (e2e)', () => {
  let app: INestApplication;
  let mailsService: MailsService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    mailsService = app.get<MailsService>(MailsService);

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/mails (GET)', () => {
    describe('Success cases', () => {
      it('should return paginated mails with default parameters', () => {
        return request(app.getHttpServer())
          .get('/mails')
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty('mails');
            expect(res.body).toHaveProperty('totalCount');
            expect(Array.isArray(res.body.mails)).toBe(true);
            expect(typeof res.body.totalCount).toBe('number');
            expect(res.body.totalCount).toBeGreaterThan(0);
            expect(res.body.mails.length).toBeLessThanOrEqual(10); // Default take = 10
          });
      });

      it('should return paginated mails with custom take parameter', () => {
        return request(app.getHttpServer())
          .get('/mails?take=5')
          .expect(200)
          .expect((res) => {
            expect(res.body.mails.length).toBeLessThanOrEqual(5);
            expect(res.body.totalCount).toBeGreaterThan(0);
          });
      });

      it('should return paginated mails with custom skip parameter', () => {
        return request(app.getHttpServer())
          .get('/mails?skip=2')
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty('mails');
            expect(res.body).toHaveProperty('totalCount');
            expect(Array.isArray(res.body.mails)).toBe(true);
          });
      });

      it('should return paginated mails with both take and skip parameters', () => {
        return request(app.getHttpServer())
          .get('/mails?take=3&skip=5')
          .expect(200)
          .expect((res) => {
            expect(res.body.mails.length).toBeLessThanOrEqual(3);
            expect(res.body.totalCount).toBeGreaterThan(0);
          });
      });

      it('should handle large skip values gracefully', () => {
        return request(app.getHttpServer())
          .get('/mails?skip=1000')
          .expect(200)
          .expect((res) => {
            expect(res.body.mails).toEqual([]);
            expect(res.body.totalCount).toBeGreaterThan(0);
          });
      });

      it('should return correct mail structure', () => {
        return request(app.getHttpServer())
          .get('/mails?take=1')
          .expect(200)
          .expect((res) => {
            if (res.body.mails.length > 0) {
              const mail = res.body.mails[0];
              expect(mail).toHaveProperty('id');
              expect(mail).toHaveProperty('from');
              expect(mail).toHaveProperty('subject');
              expect(mail).toHaveProperty('body');
              expect(mail).toHaveProperty('date');

              // Verify user structure
              expect(mail.from).toHaveProperty('name');
              expect(mail.from).toHaveProperty('email');

              // Verify data types
              expect(typeof mail.subject).toBe('string');
              expect(typeof mail.body).toBe('string');
              expect(typeof mail.date).toBe('string');
              expect(typeof mail.from.name).toBe('string');
              expect(typeof mail.from.email).toBe('string');
            }
          });
      });
    });

    describe('Validation and Error Handling', () => {
      it('should handle invalid take parameter (non-numeric)', () => {
        return request(app.getHttpServer())
          .get('/mails?take=invalid')
          .expect(400)
          .expect((res) => {
            expect(res.body).toHaveProperty('message');
            expect(res.body.message).toContain('take must be a valid number');
          });
      });

      it('should handle invalid skip parameter (non-numeric)', () => {
        return request(app.getHttpServer())
          .get('/mails?skip=invalid')
          .expect(400)
          .expect((res) => {
            expect(res.body).toHaveProperty('message');
            expect(res.body.message).toContain('skip must be a valid number');
          });
      });

      it('should handle both invalid take and skip parameters', () => {
        return request(app.getHttpServer())
          .get('/mails?take=invalid&skip=invalid')
          .expect(400)
          .expect((res) => {
            expect(res.body).toHaveProperty('message');
            expect(Array.isArray(res.body.message)).toBe(true);
            expect(
              res.body.message.some((msg: string) =>
                msg.includes('take must be a valid number'),
              ),
            ).toBe(true);
            expect(
              res.body.message.some((msg: string) =>
                msg.includes('skip must be a valid number'),
              ),
            ).toBe(true);
          });
      });

      it('should handle negative take parameter', () => {
        return request(app.getHttpServer())
          .get('/mails?take=-1')
          .expect(400)
          .expect((res) => {
            expect(res.body).toHaveProperty('message');
            expect(res.body.message).toContain('Invalid take, skip');
          });
      });

      it('should handle negative skip parameter', () => {
        return request(app.getHttpServer())
          .get('/mails?skip=-1')
          .expect(400)
          .expect((res) => {
            expect(res.body).toHaveProperty('message');
            expect(res.body.message).toContain('Invalid take, skip');
          });
      });

      it('should handle zero take parameter', () => {
        return request(app.getHttpServer())
          .get('/mails?take=0')
          .expect(400)
          .expect((res) => {
            expect(res.body).toHaveProperty('message');
            expect(res.body.message).toContain('Invalid take, skip');
          });
      });

      it('should handle zero skip parameter', () => {
        return request(app.getHttpServer())
          .get('/mails?skip=0')
          .expect(200)
          .expect((res) => {
            expect(Array.isArray(res.body.mails)).toBe(true);
            expect(res.body.totalCount).toBeGreaterThan(0);
          });
      });
    });

    describe('Performance and Limits', () => {
      it('should handle large take values', () => {
        return request(app.getHttpServer())
          .get('/mails?take=100')
          .expect(200)
          .expect((res) => {
            expect(res.body.mails.length).toBeLessThanOrEqual(100);
            expect(res.body.totalCount).toBeGreaterThan(0);
            // Should not exceed total available mails
            expect(res.body.mails.length).toBeLessThanOrEqual(
              res.body.totalCount,
            );
          });
      });

      it('should handle very large take values gracefully', () => {
        return request(app.getHttpServer())
          .get('/mails?take=10000')
          .expect(200)
          .expect((res) => {
            expect(res.body.mails.length).toBeLessThanOrEqual(
              res.body.totalCount,
            );
            expect(res.body.totalCount).toBeGreaterThan(0);
          });
      });

      it('should maintain consistent totalCount across different pagination parameters', async () => {
        const response1 = await request(app.getHttpServer())
          .get('/mails?take=5&skip=0')
          .expect(200);

        const response2 = await request(app.getHttpServer())
          .get('/mails?take=10&skip=5')
          .expect(200);

        expect(response1.body.totalCount).toBe(response2.body.totalCount);
      });
    });

    describe('Edge Cases', () => {
      it('should handle empty query parameters', () => {
        return request(app.getHttpServer())
          .get('/mails?')
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty('mails');
            expect(res.body).toHaveProperty('totalCount');
            expect(Array.isArray(res.body.mails)).toBe(true);
          });
      });

      it('should handle unknown query parameters', () => {
        return request(app.getHttpServer())
          .get('/mails?unknown=value&take=5')
          .expect(200)
          .expect((res) => {
            expect(res.body.mails.length).toBeLessThanOrEqual(5);
            expect(res.body.totalCount).toBeGreaterThan(0);
          });
      });

      it('should handle decimal values in take parameter', () => {
        return request(app.getHttpServer())
          .get('/mails?take=5.5')
          .expect(200)
          .expect((res) => {
            // parseInt should handle decimal values
            expect(res.body.mails.length).toBeLessThanOrEqual(5);
            expect(res.body.totalCount).toBeGreaterThan(0);
          });
      });

      it('should handle decimal values in skip parameter', () => {
        return request(app.getHttpServer())
          .get('/mails?skip=2.7')
          .expect(200)
          .expect((res) => {
            expect(Array.isArray(res.body.mails)).toBe(true);
            expect(res.body.totalCount).toBeGreaterThan(0);
          });
      });
    });

    describe('Data Integrity', () => {
      it('should return mails with all required fields', () => {
        return request(app.getHttpServer())
          .get('/mails?take=5')
          .expect(200)
          .expect((res) => {
            res.body.mails.forEach((mail: any) => {
              expect(mail).toHaveProperty('id');
              expect(mail).toHaveProperty('from');
              expect(mail).toHaveProperty('subject');
              expect(mail).toHaveProperty('body');
              expect(mail).toHaveProperty('date');

              // Verify from user has required fields
              expect(mail.from).toHaveProperty('name');
              expect(mail.from).toHaveProperty('email');

              // Verify field types
              expect(typeof mail.id).toBe('number');
              expect(typeof mail.subject).toBe('string');
              expect(typeof mail.body).toBe('string');
              expect(typeof mail.date).toBe('string');
              expect(typeof mail.from.name).toBe('string');
              expect(typeof mail.from.email).toBe('string');

              // Verify email format
              expect(mail.from.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
            });
          });
      });

      it('should return mails with valid date format', () => {
        return request(app.getHttpServer())
          .get('/mails?take=3')
          .expect(200)
          .expect((res) => {
            res.body.mails.forEach((mail: any) => {
              expect(() => new Date(mail.date)).not.toThrow();
              expect(new Date(mail.date).toISOString()).toBe(mail.date);
            });
          });
      });

      it('should return unique mail IDs', () => {
        return request(app.getHttpServer())
          .get('/mails?take=20')
          .expect(200)
          .expect((res) => {
            const ids = res.body.mails.map((mail: any) => mail.id);
            const uniqueIds = [...new Set(ids)];
            expect(uniqueIds.length).toBe(ids.length);
          });
      });

      it('should handle unread status correctly when present', () => {
        return request(app.getHttpServer())
          .get('/mails?take=20')
          .expect(200)
          .expect((res) => {
            res.body.mails.forEach((mail: any) => {
              if (mail.hasOwnProperty('unread')) {
                expect(typeof mail.unread).toBe('boolean');
              }
            });
          });
      });
    });

    describe('HTTP Headers and Status', () => {
      it('should return correct content-type header', () => {
        return request(app.getHttpServer())
          .get('/mails')
          .expect(200)
          .expect('Content-Type', /json/);
      });

      it('should handle HEAD request', () => {
        return request(app.getHttpServer()).head('/mails').expect(200);
      });
    });
  });

  describe('Service Integration', () => {
    it('should use MailsService correctly', () => {
      expect(mailsService).toBeDefined();
      expect(typeof mailsService.getMailPaginated).toBe('function');
    });

    it('should return consistent results between direct service call and HTTP endpoint', async () => {
      const serviceResult = mailsService.getMailPaginated({
        take: '5',
        skip: '0',
      });

      const httpResponse = await request(app.getHttpServer())
        .get('/mails?take=5&skip=0')
        .expect(200);

      expect(httpResponse.body.mails).toEqual(serviceResult.mails);
      expect(httpResponse.body.totalCount).toBe(serviceResult.totalCount);
    });
  });
});
