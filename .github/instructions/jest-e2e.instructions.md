---
applyTo: 'e2e/*.spec.ts,e2e/**/*.spec.ts'
---

# Instructions GitHub Copilot - Tests E2E avec Jest et NestJS

## Vue d'ensemble

Ce fichier contient les instructions et bonnes pratiques pour créer des tests end-to-end (e2e) avec Jest dans notre backend NestJS. Les tests e2e vérifient le comportement complet de l'application en simulant des requêtes HTTP réelles.

## Architecture des tests E2E

### Structure des fichiers

- les fichiers contenants des tests doivent un nommage clair et finir par .spec.ts

```
e2e/
├── helpers/            # Utilitaires et helpers pour les tests
├── setup/              # Configuration et setup des tests
├── app.spec.ts      # Test du app module
├── mails/
   ├── mails.spec.ts # Test du module mail
└── jest-e2e.json      # Configuration Jest pour les tests e2e
```

### Configuration Jest E2E

- Utiliser la configuration dans `e2e/jest-e2e.json`
- Pattern de fichiers : `*.spec.ts`
- Environnement : `node`
- Transformer : `ts-jest`

## Bonnes pratiques pour les tests E2E

### 1. Structure des tests

```typescript
describe('ModuleName (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    // Setup global de l'application
  });

  beforeEach(async () => {
    // Setup avant chaque test
  });

  afterEach(async () => {
    // Nettoyage après chaque test
  });

  afterAll(async () => {
    // Nettoyage global
    await app.close();
  });
});
```

### 2. Initialisation de l'application

```typescript
beforeAll(async () => {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(DatabaseService)
    .useValue(mockDatabaseService) // Si nécessaire
    .compile();

  app = moduleFixture.createNestApplication();

  // Configuration des pipes, guards, interceptors
  app.useGlobalPipes(new ValidationPipe());

  await app.init();
});
```

### 3. Tests des endpoints REST

#### GET avec pagination

```typescript
describe('/mails (GET)', () => {
  it('should return paginated mails with default parameters', () => {
    return request(app.getHttpServer())
      .get('/mails')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('data');
        expect(res.body).toHaveProperty('meta');
        expect(res.body.meta).toHaveProperty('total');
        expect(res.body.meta).toHaveProperty('page');
        expect(res.body.meta).toHaveProperty('limit');
        expect(Array.isArray(res.body.data)).toBe(true);
      });
  });

  it('should return paginated mails with custom parameters', () => {
    return request(app.getHttpServer())
      .get('/mails?page=2&limit=5')
      .expect(200)
      .expect((res) => {
        expect(res.body.meta.page).toBe(2);
        expect(res.body.meta.limit).toBe(5);
        expect(res.body.data.length).toBeLessThanOrEqual(5);
      });
  });

  it('should validate query parameters', () => {
    return request(app.getHttpServer())
      .get('/mails?page=-1&limit=0')
      .expect(400);
  });
});
```

#### POST avec validation

```typescript
describe('/resource (POST)', () => {
  it('should create a new resource with valid data', () => {
    const createDto = {
      title: 'Test Title',
      content: 'Test Content',
    };

    return request(app.getHttpServer())
      .post('/resource')
      .send(createDto)
      .expect(201)
      .expect((res) => {
        expect(res.body).toHaveProperty('id');
        expect(res.body.title).toBe(createDto.title);
        expect(res.body.content).toBe(createDto.content);
      });
  });

  it('should return 400 for invalid data', () => {
    const invalidDto = {
      title: '', // Invalid: empty title
      content: 'Valid content',
    };

    return request(app.getHttpServer())
      .post('/resource')
      .send(invalidDto)
      .expect(400)
      .expect((res) => {
        expect(res.body).toHaveProperty('message');
        expect(Array.isArray(res.body.message)).toBe(true);
      });
  });
});
```

#### Helpers pour les tests

```typescript
// e2e/helpers/test.helpers.ts
export class TestHelpers {
  static async createTestMails(app: INestApplication, count: number = 10) {
    const mailsService = app.get(MailsService);
    const mails = [];

    for (let i = 0; i < count; i++) {
      mails.push({
        ...mailFixtures.validMail,
        id: `test-${i}`,
        subject: `Test Subject ${i}`,
      });
    }

    return mails;
  }

  static async cleanupTestData(app: INestApplication) {
    // Nettoyer les données de test
  }
}
```

### 4 Tests d'erreurs et cas limites

```typescript
describe('Error Handling', () => {
  it('should handle 404 for non-existent resources', () => {
    return request(app.getHttpServer())
      .get('/mails/non-existent-id')
      .expect(404)
      .expect((res) => {
        expect(res.body).toHaveProperty('message');
        expect(res.body).toHaveProperty('statusCode', 404);
      });
  });

  it('should handle server errors gracefully', () => {
    // Mock une erreur serveur
    return request(app.getHttpServer())
      .get('/mails?trigger_error=true')
      .expect(500);
  });
});
```

### 5. Tests de performance et limites

```typescript
describe('Performance and Limits', () => {
  it('should handle large page sizes within limits', () => {
    return request(app.getHttpServer())
      .get('/mails?limit=100')
      .expect(200)
      .expect((res) => {
        expect(res.body.data.length).toBeLessThanOrEqual(100);
      });
  });

  it('should reject excessive page sizes', () => {
    return request(app.getHttpServer()).get('/mails?limit=10000').expect(400);
  });
});
```

## Conventions de nommage

### Fichiers de test

- Format : `{module-name}.spec.ts`
- Exemples : `mails.spec.ts`, `auth.spec.ts`

### Describe blocks

- Format : `{ModuleName} (e2e)`
- Sous-groupes : `/{endpoint} ({HTTP_METHOD})`

### Tests individuels

- Utiliser des descriptions claires et explicites
- Format : `should {action} when {condition}`
- Exemples :
  - `should return paginated mails with default parameters`
  - `should return 400 when invalid query parameters provided`

## Utilitaires et helpers recommandés

### 1. Helper pour les assertions communes

```typescript
export const expectPaginatedResponse = (response: any) => {
  expect(response.body).toHaveProperty('data');
  expect(response.body).toHaveProperty('meta');
  expect(response.body.meta).toHaveProperty('total');
  expect(response.body.meta).toHaveProperty('page');
  expect(response.body.meta).toHaveProperty('limit');
  expect(Array.isArray(response.body.data)).toBe(true);
};
```

### 2. Helper pour les timeouts

```typescript
export const withTimeout = (
  testFn: () => Promise<any>,
  timeout: number = 10000,
) => {
  return testFn().timeout(timeout);
};
```

## Configuration et environnement

### Variables d'environnement pour les tests

```typescript
// e2e/setup/test-environment.ts
export const testConfig = {
  database: {
    url: process.env.TEST_DATABASE_URL || 'memory://test',
  },
  server: {
    port: process.env.TEST_PORT || 3001,
  },
};
```

### Setup global

```typescript
// e2e/setup/global-setup.ts
export default async function globalSetup() {
  // Configuration globale avant tous les tests
  console.log('Setting up e2e tests...');
}

export async function globalTeardown() {
  // Nettoyage global après tous les tests
  console.log('Tearing down e2e tests...');
}
```

## Commandes et scripts

### Scripts package.json recommandés

```json
{
  "scripts": {
    "test:e2e": "jest --config ./test/jest-e2e.json",
    "test:e2e:watch": "jest --config ./test/jest-e2e.json --watch",
    "test:e2e:debug": "node --inspect-brk -r tsconfig-paths/register -r ts-node/register node_modules/.bin/jest --config ./test/jest-e2e.json --runInBand",
    "test:e2e:coverage": "jest --config ./test/jest-e2e.json --coverage"
  }
}
```

## Checklist pour nouveaux tests E2E

- [ ] Structure du test avec beforeAll/afterAll appropriés
- [ ] Initialisation correcte de l'application NestJS
- [ ] Tests des cas de succès (happy path)
- [ ] Tests des cas d'erreur et validation
- [ ] Tests des paramètres de pagination
- [ ] Vérification des codes de statut HTTP
- [ ] Vérification de la structure des réponses
- [ ] Nettoyage des données de test
- [ ] Documentation des cas de test complexes
- [ ] Gestion des timeouts pour les opérations longues

## Exemples de tests par module

### Module Mails

```typescript
// e2e/mails.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { mailFixtures } from './fixtures/mail.fixtures';

describe('Mails (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/mails (GET)', () => {
    it('should return paginated mails with default parameters', () => {
      return request(app.getHttpServer())
        .get('/mails')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('meta');
          expect(res.body.meta).toHaveProperty('total');
          expect(res.body.meta).toHaveProperty('page');
          expect(res.body.meta).toHaveProperty('limit');
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    it('should return paginated mails with custom parameters', () => {
      return request(app.getHttpServer())
        .get('/mails?page=2&limit=5')
        .expect(200)
        .expect((res) => {
          expect(res.body.meta.page).toBe(2);
          expect(res.body.meta.limit).toBe(5);
          expect(res.body.data.length).toBeLessThanOrEqual(5);
        });
    });

    it('should validate pagination parameters', () => {
      return request(app.getHttpServer())
        .get('/mails?page=0&limit=-1')
        .expect(400);
    });
  });
});
```

Cette structure et ces bonnes pratiques garantissent des tests e2e robustes, maintenables et complets pour votre backend NestJS.
