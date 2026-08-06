-- Structured visual observations.
-- Additive only. No existing table is altered and no existing row is touched;
-- references, assets, collections, projects and Design DNA are unaffected.

CREATE TABLE IF NOT EXISTS `reference_observations` (
	`id` text PRIMARY KEY NOT NULL,
	`reference_id` text NOT NULL,
	-- navigation | search | layout | typography | content | interaction |
	-- density | ai | conversion | accessibility | media | theme
	`category` text NOT NULL,
	-- Controlled vocabulary term. Validated in domain/observations.ts, not here,
	-- so the vocabulary can grow without a migration — same contract as taxonomy.
	`trait` text NOT NULL,
	-- observed | inferred | authored. Observed facts are the source of truth;
	-- aggregations count them alone unless explicitly asked otherwise.
	`provenance` text DEFAULT 'observed' NOT NULL,
	`detail` text,
	-- 0-100, only meaningful for `inferred`. Rejected on `observed`.
	`confidence` integer,
	-- The captured asset this was read from. SET NULL rather than CASCADE: a
	-- recapture replaces assets, and losing the evidence pointer must not delete
	-- the observation itself.
	`evidence_asset_id` text,
	`evidence_note` text,
	`recorded_by` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`reference_id`) REFERENCES `references`(`id`) ON DELETE cascade,
	FOREIGN KEY (`evidence_asset_id`) REFERENCES `reference_assets`(`id`) ON DELETE set null
);--> statement-breakpoint

-- One statement per trait per provenance. This is what makes recurrence counts
-- honest: a reference can assert a trait once as fact and once as inference,
-- but cannot inflate a library-wide count by repeating itself.
CREATE UNIQUE INDEX IF NOT EXISTS `observation_unique_idx` ON `reference_observations` (`reference_id`,`category`,`trait`,`provenance`);--> statement-breakpoint

-- Reading an observation panel for one reference.
CREATE INDEX IF NOT EXISTS `observation_reference_idx` ON `reference_observations` (`reference_id`);--> statement-breakpoint

-- Library-wide recurrence: "which references share this trait".
CREATE INDEX IF NOT EXISTS `observation_trait_idx` ON `reference_observations` (`category`,`trait`,`provenance`);
