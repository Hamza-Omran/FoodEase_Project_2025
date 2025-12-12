# FoodEase Test Suite

This directory contains comprehensive test files for the FoodEase backend API.

## Quick Start

```bash
# Install dependencies (if not already installed)
npm install

# Install testing dependencies
npm install --save-dev jest supertest

# Run all tests
npm test

# Run tests with coverage
npm test:coverage

# Run tests in watch mode
npm test:watch
```

## Test Files

### Authentication Tests
**File:** `auth.test.js`

Tests user authentication including registration, login, token validation, and logout.

**Coverage:**
- User registration flows
- Login validation
- Token management
- Error handling

### Order Tests
**File:** `order.test.js`

Tests order management functionality including creation, retrieval, and status updates.

**Coverage:**
- Order placement
- Order history
- Status updates
- Order tracking

### Restaurant Tests
**File:** `restaurant.test.js`

Tests restaurant and menu operations.

**Coverage:**
- Restaurant listing and filtering
- Menu item CRUD operations
- Owner permissions
- Data validation

### Cart Tests
**File:** `cart.test.js`

Tests shopping cart functionality.

**Coverage:**
- Add/remove items
- Quantity updates
- Cart calculations
- Business rule validation

## Test Database

Tests use a separate test database to avoid affecting production data.

**Database name:** `food_ordering_platform_test`

Create the test database:
```sql
CREATE DATABASE food_ordering_platform_test;
USE food_ordering_platform_test;
SOURCE database/01_tables_minimal.sql;
SOURCE database/02_triggers_minimal.sql;
SOURCE database/03_procedures_streamlined.sql;
SOURCE database/04_views_indexes_minimal.sql;
```

## Configuration

Test configuration is in `jest.config.js` and `tests/setup.js`.

Environment variables for testing are automatically set in the setup file.

## Best Practices

1. Run tests before committing code
2. Maintain test coverage above 80 percent
3. Clean up test data after tests complete
4. Use descriptive test names
5. Test both success and failure cases

## Troubleshooting

**Database Connection Issues:**
- Check MySQL is running
- Verify database credentials in setup.js
- Ensure test database exists

**Test Timeouts:**
- Increase timeout in jest.config.js
- Check for unresolved promises

For detailed documentation, see `/TESTING.md` in the project root.
