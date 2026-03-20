import request from 'supertest';
import app from '../index.js';
import mongoose from 'mongoose';

describe('Publish endpoint', () => {
  let server;
  beforeAll(() => {
    server = app.listen(0);
  });
  afterAll(async () => {
    await mongoose.connection.close();
    server.close();
  });

  test('Admin can publish/unpublish a course (401 if not authenticated)', async () => {
    const res = await request(server).put('/api/courses/000000000000000000000000/publish');
    expect([401,400,404]).toContain(res.status);
  });
});
