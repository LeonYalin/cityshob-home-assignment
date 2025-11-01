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

describe('Todo API Authentication', () => {
  describe('GET /api/todos', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/todos')
        .expect(400);

      expect(response.body.errors[0].message).toBe('Authentication required');
    });

    it('should reject invalid JWT token', async () => {
      const response = await request(app)
        .get('/api/todos')
        .set('Cookie', 'auth_token=invalid-token')
        .expect(400);

      expect(response.body.errors[0].message).toBe('Invalid or expired token');
    });
  });

  describe('GET /api/todos/:id', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/todos/123')
        .expect(400);

      expect(response.body.errors[0].message).toBe('Authentication required');
    });

    it('should reject invalid JWT token', async () => {
      const response = await request(app)
        .get('/api/todos/123')
        .set('Cookie', 'auth_token=invalid-token')
        .expect(400);

      expect(response.body.errors[0].message).toBe('Invalid or expired token');
    });
  });
});