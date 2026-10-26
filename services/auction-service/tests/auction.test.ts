import request from 'supertest';
import { app } from '../src/app';

describe('Auction Service API Tests', () => {
  it('GET /health returns 200 and healthy status for ALB', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.service).toBe('gearbids-auction-service');
  });

  it('POST /api/auth/login returns 400 when missing credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('required');
  });

  it('POST /api/auth/register returns 400 when fields are missing', async () => {
    const res = await request(app).post('/api/auth/register').send({
      username: 'testuser'
    });
    expect(res.status).toBe(400);
  });

  it('POST /api/auth/register rejects short passwords (< 8 chars)', async () => {
    const res = await request(app).post('/api/auth/register').send({
      username: 'testuser',
      email: 'test@example.com',
      password: 'short',
      full_name: 'Test User',
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('8 characters');
  });

  it('POST /api/auth/register rejects invalid email format', async () => {
    const res = await request(app).post('/api/auth/register').send({
      username: 'testuser',
      email: 'not-an-email',
      password: 'ValidPassword123!',
      full_name: 'Test User',
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Valid email');
  });

  it('POST /api/auctions requires authentication (session cookie)', async () => {
    const res = await request(app).post('/api/auctions').send({
      title: 'Fake Car'
    });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Unauthorized');
  });

  it('POST /api/auctions/:id/bid requires authentication', async () => {
    const res = await request(app).post('/api/auctions/1/bid').send({
      amount: 50000
    });
    expect(res.status).toBe(401);
  });
});
