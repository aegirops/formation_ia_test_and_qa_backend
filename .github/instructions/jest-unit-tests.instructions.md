---
applyTo: 'apps/backend/src/**/*.spec.ts'
---

# Jest Testing Architecture and Format

## File Structure and Naming

### Test File Organization

- Test files must end with `.spec.ts` suffix
- Place test files adjacent to the source files they test
- Use descriptive names that mirror the source file: `mails.service.ts` → `mails.service.spec.ts`

### Import Structure

```typescript
// NestJS testing utilities (when applicable)
import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';

// Source modules under test
import { MailsService } from './mails.service';

// DTOs and interfaces
import { PaginationParamsDto } from './dto/pagination-params.dto';
import { GetMailsPaginatedResponseDto } from './dto/get-mails-response.dto';

// Mock data
import { mails } from './mails';
```

## Test Structure Architecture

### Main Test Suite Structure

```typescript
describe('ServiceName', () => {
  let service: ServiceName;

  beforeEach(async () => {
    // Setup test module and dependencies
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('methodName', () => {
    // Method-specific tests
  });
});
```

### Method Test Organization

Organize tests for each method using nested `describe` blocks:

1. **Success scenarios** - Happy path tests
2. **Invalid input scenarios** - Error handling tests
3. **Edge cases** - Boundary conditions and unusual inputs
4. **Data integrity** - Verify response structure and data quality

```typescript
describe('methodName', () => {
  describe('Success scenarios', () => {
    // Happy path tests
  });

  describe('Invalid input scenarios', () => {
    // Error handling tests
  });

  describe('Edge cases', () => {
    // Boundary conditions
  });

  describe('Data integrity', () => {
    // Response structure validation
  });
});
```

## Test Case Structure - PREPARE/CALL/CONTROL Pattern

Every test case must follow the **PREPARE/CALL/CONTROL** pattern with clear comments:

```typescript
it('should describe what the test validates', () => {
  // PREPARE
  const inputData = {
    // Test input setup
  };
  const expectedResult = 'expected value';

  // CALL
  const result = service.methodUnderTest(inputData);

  // CONTROL
  expect(result).toBe(expectedResult);
  expect(result).toHaveProperty('propertyName');
  expect(result.array).toHaveLength(expectedLength);
});
```

### PREPARE Section

- Set up all test inputs, parameters, mocks, and expected values
- Use descriptive variable names with `expected` prefix for expected results
- Include explanatory comments for complex setups

### CALL Section

- Single line that calls the method under test
- Capture the result in a `result` variable

### CONTROL Section

- All assertions and validations
- Test return types, values, properties, and behavior
- Use specific matchers: `toBe()`, `toEqual()`, `toHaveLength()`, `toHaveProperty()`, `toBeInstanceOf()`

## Test Descriptions and Naming

### Test Suite Descriptions

- Use the class/service name: `describe('MailsService', () => {`
- Use method names for nested suites: `describe('getMailPaginated', () => {`

### Test Case Descriptions

Write descriptive test names that explain:

1. **What** the test is doing
2. **With what input** (when relevant)
3. **What behavior** is expected

**Good examples:**

```typescript
it('should return paginated mails with default pagination (take=10, skip=0)');
it('should return empty array when skip exceeds total count');
it('should handle negative take value by parsing to negative number');
it('should return mails with all required properties');
```

**Bad examples:**

```typescript
it('should work'); // Too vague
it('test pagination'); // Not descriptive
it('returns data'); // Unclear expectation
```

## Mocking and Test Data

### External Dependencies

Mock external dependencies and data sources at the top of the file:

```typescript
// Mock the data source to have control during tests
jest.mock('./mails', () => ({
  mails: [
    {
      id: 1,
      from: { name: 'Test User 1', email: 'test1@example.com' },
      subject: 'Test Subject 1',
      body: 'Test Body 1',
      date: '2024-01-01T00:00:00.000Z',
    },
    // More test data...
  ],
}));
```

### Test Data Principles

- Use predictable, controlled test data
- Include edge cases in mock data (optional fields, different data types)
- Keep test data minimal but representative
- Use consistent naming patterns (`Test User 1`, `test1@example.com`)

## Comprehensive Test Coverage

### Success Scenarios

Test all happy path variations:

- Default parameters
- Custom parameters
- Boundary values (minimum, maximum)
- Different data combinations

### Error Scenarios

Test error handling:

- Invalid inputs (NaN, empty strings, null)
- Missing required parameters
- Malformed data
- Exception throwing and catching

### Edge Cases

Test boundary conditions:

- Zero values
- Negative values
- Very large values
- Decimal numbers (when integers expected)
- Empty arrays/objects

### Data Integrity

Verify response structure:

- Correct return types (`toBeInstanceOf`)
- Required properties (`toHaveProperty`)
- Array lengths (`toHaveLength`)
- Data preservation and ordering
- Optional vs required fields

## Assertion Best Practices

### Use Specific Matchers

```typescript
// Good - specific matchers
expect(result).toBeInstanceOf(GetMailsPaginatedResponseDto);
expect(result.mails).toHaveLength(3);
expect(result.totalCount).toBe(3);
expect(result.mails[0]).toHaveProperty('id', 1);

// Avoid - generic matchers
expect(result).toBeTruthy();
expect(result.mails.length).toEqual(3);
```

### Multiple Assertions

Include multiple assertions to thoroughly validate:

- Return type/instance
- Array/object structure
- Individual property values
- Data relationships and ordering

### Array and Object Testing

```typescript
// Array length and content
expect(result.mails).toHaveLength(expectedMailsCount);
expect(result.mails[0].id).toBe(1);
expect(result.mails).toEqual([]); // For empty arrays

// Object properties
expect(result.mails[0]).toHaveProperty('id');
expect(result.mails[0]).toHaveProperty('from');
expect(result.mails[0].from).toHaveProperty('name');
expect(result.mails[0].from).toHaveProperty('email');

// Optional properties
expect(unreadMail).toHaveProperty('unread', true);
expect(readMail).not.toHaveProperty('unread');
```

## NestJS Specific Testing

### Module Setup

```typescript
beforeEach(async () => {
  const module: TestingModule = await Test.createTestingModule({
    providers: [ServiceName],
  }).compile();

  service = module.get<ServiceName>(ServiceName);
});
```

### Service Definition Test

Always include a basic service definition test:

```typescript
it('should be defined', () => {
  expect(service).toBeDefined();
});
```

## Comments and Documentation

### Inline Comments

Use comments to explain:

- Complex test scenarios
- Expected behavior with unusual inputs
- Business logic being tested

```typescript
it('should return empty array when skip exceeds total count', () => {
  // PREPARE
  const query: PaginationParamsDto = {
    take: '10',
    skip: '5', // Skip more than total mails (3)
  };
  const expectedMailsCount = 0;

  // CALL
  const result = service.getMailPaginated(query);

  // CONTROL
  expect(result.mails).toEqual([]); // slice behavior with skip > length
});
```

### Test Group Documentation

Add comments to explain the purpose of test groups:

```typescript
describe('Invalid input scenarios (NaN behavior)', () => {
  // Tests how the service handles non-numeric string inputs
  // that become NaN when parsed with parseInt()
});
```
