CREATE TABLE `pid_groups` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`pid_id` integer NOT NULL,
	`group_name` text NOT NULL,
	`display_name` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`pid_id`) REFERENCES `pids`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `pid_groups_pid_id_unique` ON `pid_groups` (`pid_id`);--> statement-breakpoint
CREATE TABLE `pids` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`unit` text NOT NULL,
	`pid_code` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `pids_name_unique` ON `pids` (`name`);--> statement-breakpoint
CREATE TABLE `readings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`session_id` integer NOT NULL,
	`pid_id` integer NOT NULL,
	`offset_seconds` real NOT NULL,
	`value` real NOT NULL,
	`lat` real,
	`lon` real,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`pid_id`) REFERENCES `pids`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `readings_session_pid_idx` ON `readings` (`session_id`,`pid_id`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`filename` text NOT NULL,
	`name` text NOT NULL,
	`started_at` integer NOT NULL,
	`duration_seconds` real NOT NULL,
	`pid_count` integer NOT NULL,
	`row_count` integer NOT NULL,
	`distance_miles` real,
	`has_gps` integer DEFAULT false NOT NULL,
	`ingested_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_filename_unique` ON `sessions` (`filename`);