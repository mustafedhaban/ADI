-- Visual capture pipeline (v2)
-- Additive only. `references.image` is deliberately left untouched so existing
-- author-supplied previews keep working; captured assets live in their own table.

ALTER TABLE `references` ADD `capture_status` text DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE `references` ADD `capture_error` text;--> statement-breakpoint
ALTER TABLE `references` ADD `captured_at` text;--> statement-breakpoint
ALTER TABLE `references` ADD `capture_attempts` integer DEFAULT 0 NOT NULL;--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `reference_assets` (
	`id` text PRIMARY KEY NOT NULL,
	`reference_id` text NOT NULL,
	`kind` text NOT NULL,
	`path` text NOT NULL,
	`format` text NOT NULL,
	`width` integer NOT NULL,
	`height` integer NOT NULL,
	`file_size` integer NOT NULL,
	`checksum` text NOT NULL,
	`viewport_width` integer,
	`viewport_height` integer,
	`device_scale_factor` integer,
	`version` integer DEFAULT 1 NOT NULL,
	`captured_at` text DEFAULT (datetime('now')) NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`reference_id`) REFERENCES `references`(`id`) ON DELETE cascade
);--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS `reference_asset_kind_version_idx` ON `reference_assets` (`reference_id`,`kind`,`version`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `reference_asset_reference_idx` ON `reference_assets` (`reference_id`);--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `capture_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`total` integer DEFAULT 0 NOT NULL,
	`completed` integer DEFAULT 0 NOT NULL,
	`failed` integer DEFAULT 0 NOT NULL,
	`skipped` integer DEFAULT 0 NOT NULL,
	`message` text,
	`started_at` text,
	`finished_at` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);--> statement-breakpoint

-- Backfill: every existing reference starts life as 'pending' capture.
-- References that already carry an author-supplied image stay pending too —
-- the pipeline will still capture them, and `image` remains the fallback.
UPDATE `references` SET `capture_status` = 'pending' WHERE `capture_status` IS NULL;
