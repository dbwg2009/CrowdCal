import { Hono } from 'hono';
import { cors } from 'hono/cors';
import api from './api.js';

const app = new Hono();

app.use('/api/*', cors({
  origin: 'https://crowdcal.pages.dev',
  allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type'],
}));

app.route('/api', api);

app.get('/', (c) => c.text('CrowdCal API is running.'));

export default app;