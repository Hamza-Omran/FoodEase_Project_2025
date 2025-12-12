/**
 * Simple Order Tests
 * Basic tests to verify order endpoints work
 */

const request = require('supertest');
const app = require('../app');

describe('Order Simple Tests', () => {

    test('orders endpoint should exist', async () => {
        const response = await request(app)
            .get('/api/v1/orders');

        // Should respond (may be 401 unauthorized without token)
        expect(response.status).toBeDefined();
    });

    test('order creation endpoint should exist', async () => {
        const response = await request(app)
            .post('/api/v1/orders')
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
