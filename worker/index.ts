// Entry point for CrowdCal Cloudflare Worker (Hono.js)
import { Hono } from 'hono';
import api from './api';

const app = new Hono();

app.route('/api', api);

app.get('/', (c) => c.text('CrowdCal API is running.'));

export default app;
