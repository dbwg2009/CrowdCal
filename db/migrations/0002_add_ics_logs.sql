-- Add ICS access logs table for tracking calendar subscribers
CREATE TABLE `ics_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`ip_address` text NOT NULL,
	`user_agent` text NOT NULL,
	`accessed_at` text NOT NULL
);
