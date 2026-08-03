CREATE TABLE IF NOT EXISTS `references` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`source` text NOT NULL,
	`url` text NOT NULL,
	`image` text,
	`type` text NOT NULL,
	`description` text,
	`why_saved` text,
	`what_to_learn` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `references_url_idx` ON `references` (`url`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `industries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL UNIQUE
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `page_types` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL UNIQUE
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `styles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL UNIQUE
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `patterns` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL UNIQUE
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `tags` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL UNIQUE
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `reference_industries` (
	`reference_id` text NOT NULL,
	`industry_id` integer NOT NULL,
	FOREIGN KEY (`reference_id`) REFERENCES `references`(`id`) ON DELETE cascade,
	FOREIGN KEY (`industry_id`) REFERENCES `industries`(`id`) ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `ref_industry_idx` ON `reference_industries` (`reference_id`,`industry_id`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `reference_page_types` (
	`reference_id` text NOT NULL,
	`page_type_id` integer NOT NULL,
	FOREIGN KEY (`reference_id`) REFERENCES `references`(`id`) ON DELETE cascade,
	FOREIGN KEY (`page_type_id`) REFERENCES `page_types`(`id`) ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `ref_page_type_idx` ON `reference_page_types` (`reference_id`,`page_type_id`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `reference_styles` (
	`reference_id` text NOT NULL,
	`style_id` integer NOT NULL,
	FOREIGN KEY (`reference_id`) REFERENCES `references`(`id`) ON DELETE cascade,
	FOREIGN KEY (`style_id`) REFERENCES `styles`(`id`) ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `ref_style_idx` ON `reference_styles` (`reference_id`,`style_id`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `reference_patterns` (
	`reference_id` text NOT NULL,
	`pattern_id` integer NOT NULL,
	FOREIGN KEY (`reference_id`) REFERENCES `references`(`id`) ON DELETE cascade,
	FOREIGN KEY (`pattern_id`) REFERENCES `patterns`(`id`) ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `ref_pattern_idx` ON `reference_patterns` (`reference_id`,`pattern_id`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `reference_tags` (
	`reference_id` text NOT NULL,
	`tag_id` integer NOT NULL,
	FOREIGN KEY (`reference_id`) REFERENCES `references`(`id`) ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `ref_tag_idx` ON `reference_tags` (`reference_id`,`tag_id`);
