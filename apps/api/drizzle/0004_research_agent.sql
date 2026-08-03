CREATE TABLE IF NOT EXISTS `research_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`focus` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`sources` text,
	`result_limit` integer DEFAULT 20 NOT NULL,
	`query` text,
	`message` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`completed_at` text,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `research_candidates` (
	`id` text PRIMARY KEY NOT NULL,
	`research_id` text NOT NULL,
	`title` text NOT NULL,
	`url` text NOT NULL,
	`source` text DEFAULT 'Other' NOT NULL,
	`description` text,
	`image` text,
	`relevance_score` integer,
	`relevance_reason` text,
	`matched_criteria` text,
	`suggested_styles` text,
	`suggested_patterns` text,
	`suggested_tags` text,
	`status` text DEFAULT 'candidate' NOT NULL,
	`reference_id` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`research_id`) REFERENCES `research_runs`(`id`) ON DELETE cascade,
	FOREIGN KEY (`reference_id`) REFERENCES `references`(`id`) ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `research_candidate_url_idx` ON `research_candidates` (`research_id`,`url`);
