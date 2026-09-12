CREATE TABLE `articleComments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`articleId` int NOT NULL,
	`userId` int NOT NULL,
	`authorName` varchar(255) NOT NULL,
	`body` text NOT NULL,
	`status` enum('visible','hidden') NOT NULL DEFAULT 'visible',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `articleComments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `articleRatings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`articleId` int NOT NULL,
	`userId` int NOT NULL,
	`rating` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `articleRatings_id` PRIMARY KEY(`id`),
	CONSTRAINT `articleRatings_article_user_unique` UNIQUE(`articleId`,`userId`)
);
--> statement-breakpoint
CREATE TABLE `articleVotes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`articleId` int NOT NULL,
	`userId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `articleVotes_id` PRIMARY KEY(`id`),
	CONSTRAINT `articleVotes_article_user_unique` UNIQUE(`articleId`,`userId`)
);
