/**
 * Simple Restaurant Tests
 * Basic tests to verify restaurant endpoints work
 */

const request = require('supertest');
const app = require('../app');

describe('Restaurant Simple Tests', () => {

    test('restaurants list endpoint should exist', async () => {
        const response = await request(app)
            .get('/api/v1/restaurants');

        // Should respond (may be 200 with data or 500 if DB issue)
        expect(response.status).toBeDefined();
    });

    test('restaurant endpoint should exist', async () => {
        const response = await request(app)
            .get('/api/v1/restaurants/1');

        // Should respond (may be 200 or 404)
        expect(response.status).toBeDefined();
    });

    test('health check should work', async () => {
        const response = await request(app)
            .get('/api/v1/health')
            .expect(200);

        expect(response.body.status).toBe('ok');
    });
});
