# AZpact Test Suite

This directory contains automated tests for the AZpact application.

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test engine.test.ts
```

## Test Structure

- **engine.test.ts** - Tests for the impact evaluation engine
- **type-guards.test.ts** - Tests for type validation and guards
- **sku-lookup.test.ts** - Tests for SKU lookup functionality

## Writing Tests

### Example Test

```typescript
import { describe, it, expect } from 'vitest';
import { evaluateImpact } from '@/lib/engine';

describe('Feature Name', () => {
  it('should do something specific', () => {
    // Arrange
    const input = { /* test data */ };

    // Act
    const result = evaluateImpact(context, action);

    // Assert
    expect(result).toBeDefined();
    expect(result.blocked).toBe(false);
  });
});
```

## Test Coverage Goals

- **Critical Paths**: 100% coverage (evaluation engine, rule matching)
- **Business Logic**: 90%+ coverage (SKU validation, type guards)
- **UI Components**: 70%+ coverage (forms, reports)

## TODO: Tests to Add

### High Priority
- [ ] Rule condition evaluation tests
- [ ] Mitigation lookup tests
- [ ] URL parameter validation tests
- [ ] CSP header tests

### Medium Priority
- [ ] Component rendering tests (React Testing Library)
- [ ] Error boundary tests
- [ ] Integration tests for full evaluation flow
- [ ] KB file validation tests

### Low Priority
- [ ] Accessibility tests
- [ ] Performance tests
- [ ] E2E tests with Playwright

## CI/CD Integration

Tests run automatically on:
- Every push to main branch
- All pull requests
- Pre-commit hook (if configured)

## Debugging Tests

### View test output
```bash
npm test -- --reporter=verbose
```

### Debug specific test
```bash
npm test -- --grep "should return error for invalid SKU"
```

### Run with debugging
```bash
NODE_OPTIONS='--inspect-brk' npm test
```

## Best Practices

1. **Test Naming**: Use descriptive names that explain what is being tested
2. **Arrange-Act-Assert**: Structure tests clearly with AAA pattern
3. **Isolation**: Each test should be independent and not rely on others
4. **Mock Sparingly**: Only mock external dependencies, not internal logic
5. **Coverage**: Aim for high coverage but prioritize meaningful tests over 100%
