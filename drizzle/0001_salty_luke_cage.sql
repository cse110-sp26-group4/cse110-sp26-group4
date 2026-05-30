ALTER TABLE `issues` ADD `last_updated` text DEFAULT CURRENT_TIMESTAMP NOT NULL;--> statement-breakpoint
ALTER TABLE `issues` ADD `assignees` text DEFAULT '[]';--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_activity` (
	`log_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`issue_id` integer,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`action` text NOT NULL,
	`details` text,
	CONSTRAINT "activity_action_check" CHECK("__new_activity"."action" IN ('state_change', 'priority_change', 'edit', 'read', 'creation', 'deletion', 'rejection'))
);
--> statement-breakpoint
INSERT INTO `__new_activity`("log_id", "issue_id", "created_at", "action", "details") SELECT "log_id", "issue_id", "created_at", "action", "details" FROM `activity`;--> statement-breakpoint
DROP TABLE `activity`;--> statement-breakpoint
ALTER TABLE `__new_activity` RENAME TO `activity`;--> statement-breakpoint
PRAGMA foreign_keys=ON;