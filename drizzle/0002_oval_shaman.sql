ALTER TABLE `articles` MODIFY COLUMN `status` enum('draft','submitted','changes_requested','approved','published') NOT NULL DEFAULT 'draft';--> statement-breakpoint
ALTER TABLE `articles` ADD `authorId` int;--> statement-breakpoint
ALTER TABLE `articles` ADD `authorName` varchar(255);--> statement-breakpoint
ALTER TABLE `articles` ADD `reviewNote` text;--> statement-breakpoint
ALTER TABLE `articles` ADD `submittedAt` timestamp;--> statement-breakpoint
ALTER TABLE `articles` ADD `reviewedAt` timestamp;--> statement-breakpoint
ALTER TABLE `articles` ADD `reviewedById` int;