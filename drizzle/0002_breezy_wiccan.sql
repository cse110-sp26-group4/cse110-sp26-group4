CREATE TABLE `agents` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `agents_name_unique` ON `agents` (`name`);--> statement-breakpoint
ALTER TABLE `activity` ADD `actor_id` integer REFERENCES agents(id);--> statement-breakpoint
ALTER TABLE `issues` ADD `assignee_id` integer REFERENCES agents(id);--> statement-breakpoint
ALTER TABLE `issues` DROP COLUMN `assignees`;