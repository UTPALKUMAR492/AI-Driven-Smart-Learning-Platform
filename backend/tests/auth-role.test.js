import request from 'supertest';
import app from '../index.js';

describe('Registration role enforcement', () => {
  it('should not allow creating an admin via public register', async () => {
    const unique = Date.now();
    const email = `test+${unique}@example.com`;
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Role Test', email, password: 'password123', role: 'admin' })
      .set('Accept', 'application/json');

    expect([200,201,400]).toContain(res.status);
    // if created, ensure role is not admin
    if (res.body.user) {
      expect(res.body.user.role).not.toBe('admin');
    } else {
      // if not created because already exists or validation error, ensure it's not exposing an admin creation
      expect(res.body.message).not.toMatch(/admin/i);
    }
  }, 20000);
});
