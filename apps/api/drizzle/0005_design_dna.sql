CREATE TABLE IF NOT EXISTS `design_dna` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`version` integer NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`content` text NOT NULL,
	`reference_count` integer DEFAULT 0 NOT NULL,
	`source_collection_ids` text,
	`generated_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `design_dna_project_version_idx` ON `design_dna` (`project_id`,`version`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `design_dna_evidence` (
	`id` text PRIMARY KEY NOT NULL,
	`dna_id` text NOT NULL,
	`reference_id` text NOT NULL,
	`section` text NOT NULL,
	`insight` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`dna_id`) REFERENCES `design_dna`(`id`) ON DELETE cascade,
	FOREIGN KEY (`reference_id`) REFERENCES `references`(`id`) ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `design_dna_evidence_idx` ON `design_dna_evidence` (`dna_id`,`reference_id`,`section`,`insight`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `design_dna_evidence_dna_idx` ON `design_dna_evidence` (`dna_id`);
