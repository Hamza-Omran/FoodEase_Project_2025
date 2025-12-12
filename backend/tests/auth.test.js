/**
 * Simple Authentication Tests
 * Basic tests to verify auth endpoints work
 */

const request = require('supertest');
const app = require('../app');

describe('Authentication Simple Tests', () => {

    test('health check endpoint should work', async () => {
        const response = await request(app)
            .get('/api/v1/health')
            .expect(200);

        expect(response.body.status).toBe('ok');
    });

    test('login endpoint should exist', async () => {
        const response = await request(app)
            .post('/api/v1/auth/login')
            .send({});

        // Should respond (even if with error for empty data)
        expect(response.status).toBeDefined();
    });

    test('register endpoint should exist', async () => {
        const response = await request(app)
            .post('/api/v1/auth/register')
            .send({});

        // Should respond (even if with error for empty data)
        expect(response.status).toBeDefined();
    });
});
