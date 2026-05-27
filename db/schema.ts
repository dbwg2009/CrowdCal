// Drizzle ORM schema for CrowdCal
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const events = sqliteTable('events', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  datetime: text('datetime').notNull(), // ISO yyyy-mm-dd string
  location: text('location'),
  description: text('description'),
  submitted_by: text('submitted_by').notNull(),
  spotify_playlist_url: text('spotify_playlist_url'),
  created_at: text('created_at').notNull(),
});

export const rsvps = sqliteTable('rsvps', {
  id: text('id').primaryKey(),
  event_id: text('event_id').notNull().references(() => events.id),
  name: text('name').notNull(),
  created_at: text('created_at').notNull(),
});
