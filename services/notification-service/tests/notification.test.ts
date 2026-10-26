import request from 'supertest';
import { app } from '../src/app';

describe('Notification Service API Tests', () => {
  it('GET /health returns 200 and healthy status with version info', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.service).toBe('gearbids-notification-service');
    expect(res.body.version).toBeDefined();
    expect(res.body.release_tag).toBeDefined();
    expect(res.body.git_commit).toBeDefined();
  });

  it('GET /version returns service provenance', async () => {
    const res = await request(app).get('/version');
    expect(res.status).toBe(200);
    expect(res.body.service).toBe('gearbids-notification-service');
    expect(res.body.version).toBeDefined();
  });

  it('GET /api/notifications without userId returns 400', async () => {
    const res = await request(app).get('/api/notifications');
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('userId');
  });

  it('POST /events without type returns 400', async () => {
    const res = await request(app).post('/events').send({
      recipient_user_id: 1,
    });
    expect(res.status).toBe(400);
  });

  it('POST /api/notifications/events returns 404 (not exposed publicly)', async () => {
    const res = await request(app).post('/api/notifications/events').send({
      type: 'OUTBID',
      recipient_user_id: 1,
    });
    expect(res.status).toBe(404);
  });
});
