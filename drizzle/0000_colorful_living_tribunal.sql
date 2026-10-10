CREATE TABLE `attendance` (
	`id` text PRIMARY KEY NOT NULL,
	`person` text NOT NULL,
	`control` text NOT NULL,
	`at` text NOT NULL,
	`method` text NOT NULL,
	`actor` text NOT NULL,
	FOREIGN KEY (`person`) REFERENCES `people`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`control`) REFERENCES `controls`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `unique_attendance` ON `attendance` (`person`,`control`);--> statement-breakpoint
CREATE TABLE `controls` (
	`id` text PRIMARY KEY NOT NULL,
	`event` text NOT NULL,
	`day` text NOT NULL,
	`label` text NOT NULL,
	`kind` text NOT NULL,
	`position` integer NOT NULL,
	FOREIGN KEY (`event`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`mode` text NOT NULL,
	`closed` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `people` (
	`id` text PRIMARY KEY NOT NULL,
	`mfc` text,
	`name` text NOT NULL,
	`sector` text NOT NULL,
	`source` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `unique_mfc` ON `people` (`mfc`);