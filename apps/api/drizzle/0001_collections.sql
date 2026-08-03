CREATE TABLE IF NOT EXISTS `collections` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`cover_image` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `collection_references` (
	`collection_id` text NOT NULL,
	`reference_id` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`collection_id`) REFERENCES `collections`(`id`) ON DELETE cascade,
	FOREIGN KEY (`reference_id`) REFERENCES `references`(`id`) ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `collection_ref_idx` ON `collection_references` (`collection_id`,`reference_id`);
