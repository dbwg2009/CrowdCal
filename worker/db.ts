// Drizzle ORM setup for CrowdCal
import { drizzle } from 'drizzle-orm/d1';
import * as schema from '../db/schema.js';
import type { Env } from './types.js';

export function getDb(env: Env) {
  return drizzle(env.DB, { schema });
}
