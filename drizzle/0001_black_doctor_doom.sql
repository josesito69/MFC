ALTER TABLE `events` ADD `audience` text DEFAULT 'general' NOT NULL;--> statement-breakpoint
ALTER TABLE `events` ADD `role_filter` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `people` ADD `role` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `people` ADD `type` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `people` ADD `photo` text DEFAULT '' NOT NULL;