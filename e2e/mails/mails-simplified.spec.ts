import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { MailsService } from '../../src/mails/mails.service';
import { TestHelpers } from '../helpers/test-helpers';
import { MailFixtures } from '../fixtures/mail.fixtures';

describe('Mails (e2e) - Simplified', () => {
  let app: INestApplication;
  let mailsService: MailsService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    mailsService = TestHelpers.getMailsService(app);

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/mails (GET)', () => {
    describe('Success Cases', () => {
      it('should return paginated mails with default parameters', () => {
        return request(app.getHttpServer())
          .get('/mails')
          .expect(200)
          .expect((res) => {
            TestHelpers.expectPaginatedMailsResponse(res);
            TestHelpers.expectValidMailsArray(res.body.mails);
            TestHelpers.expectRespectsTakeLimit(res, 10); // Default take = 10
          });
      });

      // Test avec les cas de pagination prédéfinis
      MailFixtures.paginationTestData.testCases.forEach(
        ({ take, skip, description }) => {
          it(`should handle pagination: ${description}`, () => {
            const queryString = TestHelpers.buildQueryString({ take, skip });

            return request(app.getHttpServer())
              .get(`/mails${queryString}`)
              .expect(200)
              .expect((res) => {
                TestHelpers.expectPaginatedMailsResponse(res);
                TestHelpers.expectValidMailsArray(res.body.mails);

                if (take) {
                  TestHelpers.expectRespectsTakeLimit(res, parseInt(take, 10));
                }
              });
          });
        },
      );

      it('should return mails with correct structure', () => {
        return request(app.getHttpServer())
          .get('/mails?take=3')
          .expect(200)
          .expect((res) => {
            TestHelpers.expectPaginatedMailsResponse(res);

            res.body.mails.forEach((mail: any) => {
              TestHelpers.expectValidMailStructure(mail);
            });

            TestHelpers.expectUniqueMailIds(res.body.mails);
          });
      });

      it('should maintain consistent totalCount across different requests', async () => {
        const response1 = await request(app.getHttpServer())
          .get('/mails?take=5&skip=0')
          .expect(200);

        const response2 = await request(app.getHttpServer())
          .get('/mails?take=10&skip=5')
          .expect(200);

        TestHelpers.expectConsistentTotalCount(response1, response2);
      });
    });

    describe('Validation and Error Handling', () => {
      const validationCases = TestHelpers.getValidationTestCases();

      validationCases.forEach(({ take, skip, description, expectedStatus }) => {
        it(`should handle ${description}`, () => {
          const queryString = TestHelpers.buildQueryString({ take, skip });

          return request(app.getHttpServer())
            .get(`/mails${queryString}`)
            .expect(expectedStatus)
            .expect((res) => {
              if (expectedStatus === 400) {
                expect(res.body).toHaveProperty('message');
                // Check for specific validation messages
                if (take === 'invalid') {
                  expect(res.body.message).toContain(
                    MailFixtures.errorMessages.invalidTake,
                  );
                } else if (skip === 'invalid') {
                  expect(res.body.message).toContain(
                    MailFixtures.errorMessages.invalidSkip,
                  );
                } else if (take === 'invalid' && skip === 'invalid') {
                  expect(
                    res.body.message.some(
                      (msg: string) =>
                        msg.includes(MailFixtures.errorMessages.invalidTake) ||
                        msg.includes(MailFixtures.errorMessages.invalidSkip),
                    ),
                  ).toBe(true);
                } else if (take === '-1' || skip === '-1' || take === '0') {
                  // For negative values and zero take, service throws generic error
                  expect(res.body.message).toContain(
                    MailFixtures.errorMessages.invalidTakeSkip,
                  );
                }
              } else if (expectedStatus === 200) {
                TestHelpers.expectPaginatedMailsResponse(res);
              }
            });
        });
      });

      it('should handle unknown query parameters gracefully', () => {
        return request(app.getHttpServer())
          .get('/mails?unknown=value&invalid=param&take=5')
          .expect(200)
          .expect((res) => {
            TestHelpers.expectPaginatedMailsResponse(res);
            TestHelpers.expectRespectsTakeLimit(res, 5);
          });
      });
    });

    describe('Edge Cases and Performance', () => {
      it('should handle large pagination values', () => {
        return request(app.getHttpServer())
          .get('/mails?take=1000&skip=0')
          .expect(200)
          .expect((res) => {
            TestHelpers.expectPaginatedMailsResponse(res);
            expect(res.body.mails.length).toBeLessThanOrEqual(
              res.body.totalCount,
            );
          });
      });

      it('should handle skip beyond available data', () => {
        return request(app.getHttpServer())
          .get('/mails?take=10&skip=10000')
          .expect(200)
          .expect((res) => {
            TestHelpers.expectPaginatedMailsResponse(res);
            expect(res.body.mails).toEqual([]);
            expect(res.body.totalCount).toBeGreaterThan(0);
          });
      });

      it('should return correct HTTP headers', () => {
        return request(app.getHttpServer())
          .get('/mails')
          .expect(200)
          .expect('Content-Type', /json/)
          .expect((res) => {
            TestHelpers.expectPaginatedMailsResponse(res);
          });
      });
    });

    describe('Service Integration', () => {
      it('should integrate correctly with MailsService', () => {
        expect(mailsService).toBeDefined();
        expect(typeof mailsService.getMailPaginated).toBe('function');
      });

      it('should return consistent results between service and HTTP calls', async () => {
        const serviceParams = { take: '5', skip: '2' };
        const serviceResult = mailsService.getMailPaginated(serviceParams);

        const httpResponse = await request(app.getHttpServer())
          .get('/mails?take=5&skip=2')
          .expect(200);

        expect(httpResponse.body.mails).toEqual(serviceResult.mails);
        expect(httpResponse.body.totalCount).toBe(serviceResult.totalCount);
      });
    });

    describe('Data Quality', () => {
      it('should return valid email addresses', () => {
        return request(app.getHttpServer())
          .get('/mails?take=10')
          .expect(200)
          .expect((res) => {
            res.body.mails.forEach((mail: any) => {
              expect(mail.from.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
            });
          });
      });

      it('should return valid ISO date strings', () => {
        return request(app.getHttpServer())
          .get('/mails?take=5')
          .expect(200)
          .expect((res) => {
            res.body.mails.forEach((mail: any) => {
              expect(() => new Date(mail.date)).not.toThrow();
              expect(new Date(mail.date).toISOString()).toBe(mail.date);
            });
          });
      });

      it('should have non-empty required fields', () => {
        return request(app.getHttpServer())
          .get('/mails?take=10')
          .expect(200)
          .expect((res) => {
            res.body.mails.forEach((mail: any) => {
              expect(mail.subject.length).toBeGreaterThan(0);
              expect(mail.body.length).toBeGreaterThan(0);
              expect(mail.from.name.length).toBeGreaterThan(0);
              expect(mail.from.email.length).toBeGreaterThan(0);
            });
          });
      });
    });
  });
});
