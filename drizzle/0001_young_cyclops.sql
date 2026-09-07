CREATE TABLE `articles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(180) NOT NULL,
	`title` varchar(255) NOT NULL,
	`excerpt` text NOT NULL,
	`topic` enum('living','food','environment','ethics') NOT NULL,
	`status` enum('draft','published') NOT NULL DEFAULT 'draft',
	`body` json NOT NULL,
	`coverImageKey` varchar(520),
	`coverImageUrl` varchar(1024),
	`coverAlt` varchar(300),
	`videoUrl` varchar(1024),
	`references` json NOT NULL,
	`publishedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `articles_id` PRIMARY KEY(`id`),
	CONSTRAINT `articles_slug_unique` UNIQUE(`slug`)
);
