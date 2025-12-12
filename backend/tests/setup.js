/**
 * Backend Test Setup File
 * 
 * Global setup configuration for all backend tests.
 * This file runs before all test files to configure the testing environment.
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_key_for_testing_only';
process.env.DB_HOST = 'localhost';
process.env.DB_USER = 'root';
process.env.DB_PASSWORD = 'NoProblem123!';
process.env.DB_NAME = 'food_ordering_platform_test';

// Global test timeout
jest.setTimeout(10000);

// Suppress console logs during tests (optional)
global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
};
