# FoodEase Frontend Test Suite

This directory contains comprehensive test files for the FoodEase frontend React application.

## Quick Start

```bash
# Install dependencies (if not already installed)
npm install

# Install testing dependencies
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @vitest/ui

# Run all tests
npm test

# Run tests with coverage
npm test:coverage

# Run tests with UI
npm test:ui
```

## Test Files

### AuthContext Tests
**File:** `AuthContext.test.jsx`

Tests authentication state management and context functionality.

**Coverage:**
- Login flow
- Registration flow
- Token persistence
- User state management
- Error handling

### Cart Page Tests
**File:** `CartPage.test.jsx`

Tests the shopping cart user interface and interactions.

**Coverage:**
- Display cart items
- Update quantities
- Remove items
- Price calculations
- Checkout navigation

### Restaurants Page Tests
**File:** `Restaurants.test.jsx`

Tests the restaurant listing page.

**Coverage:**
- Display restaurants
- Filter by cuisine
- Search functionality
- Sort options
- Navigation

### Order Tracking Tests
**File:** `OrderTracking.test.jsx`

Tests the order tracking interface.

**Coverage:**
- Display order details
- Status progression
- Delivery information
- Real-time updates
- Error states

## Test Configuration

Test configuration is in `/frontend/vitest.config.js`.

Setup file is located at `tests/setup.js` and runs before all tests.

## Running Tests

### All Tests
```bash
npm test
```

### Specific Test File
```bash
npm test AuthContext.test.jsx
```

### Watch Mode
```bash
npm test -- --watch
```

### Coverage Report
```bash
npm test:coverage
```

View coverage report: `coverage/index.html`

### Interactive UI
```bash
npm test:ui
```

## Writing Tests

### Component Test Template
```javascript
import { render, screen } from '@testing-library/react';
import { describe, test, expect } from 'vitest';

describe('ComponentName', () => {
  test('should render correctly', () => {
    render(<ComponentName />);
    expect(screen.getByText('Expected')).toBeInTheDocument();
  });
});
```

### Context Test Template
```javascript
import { renderHook } from '@testing-library/react';
import { describe, test, expect } from 'vitest';

describe('useCustomHook', () => {
  test('should return expected value', () => {
    const { result } = renderHook(() => useCustomHook());
    expect(result.current).toBeDefined();
  });
});
```

## Best Practices

1. Test user interactions, not implementation details
2. Use semantic queries (getByRole, getByLabelText)
3. Mock external API calls
4. Clean up after each test
5. Test accessibility features
6. Keep tests simple and focused

## Mocking

### Mock API Calls
```javascript
vi.mock('../services/api', () => ({
  apiFunction: vi.fn()
}));
```

### Mock Router
```javascript
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  ...actual,
  useNavigate: () => mockNavigate
}));
```

## Troubleshooting

**Component Not Rendering:**
- Wrap in required providers (AuthProvider, BrowserRouter)
- Check console for errors

**Async Tests Failing:**
- Use waitFor for async operations
- Ensure promises resolve/reject

**Mock Not Working:**
- Place mock before imports
- Clear mocks between tests

For detailed documentation, see `/TESTING.md` in the project root.
