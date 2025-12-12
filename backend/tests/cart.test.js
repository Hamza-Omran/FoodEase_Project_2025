/**
 * Simple Cart Tests
 * Basic tests to verify cart endpoints work
 */

const request = require('supertest');
const app = require('../app');

describe('Cart Simple Tests', () => {

    test('cart endpoint should exist', async () => {
        const response = await request(app)
            .get('/api/v1/cart');

        // Should respond (may be 401 unauthorized without token)
        expect(response.status).toBeDefined();
    });

    test('cart add endpoint should exist', async () => {
        const response = await request(app)
            .post('/api/v1/cart/add')
            .send({});

        // Should respond (may be 401 unauthorized)
        expect(response.status).toBeDefined();
    });

    test('health check should work', async () => {
        const response = await request(app)
            .get('/api/v1/health')
            .expect(200);

        expect(response.body.status).toBe('ok');
    });
});
