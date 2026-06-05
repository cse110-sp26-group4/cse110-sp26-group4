CREATE TABLE `activity` (
	`log_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`issue_id` integer,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`action` text NOT NULL,
	`details` text
);
--> statement-breakpoint
CREATE TABLE `issues` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`attempt_num` integer DEFAULT 0 NOT NULL,
	`title` text DEFAULT 'PENDING' NOT NULL,
	`status` text DEFAULT 'Open' NOT NULL,
	`priority` text DEFAULT 'Low',
	`token_limit` integer,
	`description` text
);
