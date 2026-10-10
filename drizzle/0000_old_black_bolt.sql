CREATE TABLE `demo_feedback` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`language` text NOT NULL,
	`stage` text NOT NULL,
	`experience` text NOT NULL,
	`message` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `demo_feedback_created` ON `demo_feedback` (`created_at`);--> statement-breakpoint
CREATE TABLE `demo_limits` (
	`bucket` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `demo_limits_expiry` ON `demo_limits` (`expires_at`);--> statement-breakpoint
CREATE TABLE `demo_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`language` text NOT NULL,
	`stage` text NOT NULL,
	`mode` text,
	`started` integer DEFAULT 0 NOT NULL,
	`completed` integer DEFAULT 0 NOT NULL,
	`active_seconds` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `demo_sessions_created` ON `demo_sessions` (`created_at`);--> statement-breakpoint
CREATE TABLE `demo_stages` (
	`session_id` text NOT NULL,
	`stage` text NOT NULL,
	`active_seconds` integer DEFAULT 0 NOT NULL,
	`updated_at` integer NOT NULL,
	PRIMARY KEY(`session_id`, `stage`),
	FOREIGN KEY (`session_id`) REFERENCES `demo_sessions`(`id`) ON UPDATE no action ON DELETE cascade
);
