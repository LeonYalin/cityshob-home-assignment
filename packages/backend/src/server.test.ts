import request from 'supertest';
import app from './server';

describe('Server Health Check', () => {
  it('should return health status', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect(200);

    expect(response.body.status).toBe('OK');
    expect(response.body.service).toBe('Real-Time Todo API');
    expect(response.body.timestamp).toBeDefined();
  });

  it('should return 404 for unknown API routes', async () => {
    const response = await request(app)
      .get('/api/unknown')
      .expect(404);

    expect(response.body.error).toBe('API endpoint not found');
  });
});