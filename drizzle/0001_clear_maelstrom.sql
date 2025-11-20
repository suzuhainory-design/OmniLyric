CREATE TABLE `feedbackHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`lyricId` int NOT NULL,
	`feedbackType` enum('like','dislike','neutral') NOT NULL,
	`comment` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `feedbackHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `keywords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`keyword` varchar(255) NOT NULL,
	`searchResults` text,
	`weight` float NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `keywords_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lyrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255),
	`content` text NOT NULL,
	`languages` varchar(255) NOT NULL,
	`isMixed` boolean NOT NULL DEFAULT false,
	`translation` text,
	`keywordIds` text,
	`melodyId` int,
	`satisfactionScore` float NOT NULL DEFAULT 0,
	`weight` float NOT NULL DEFAULT 1,
	`timingData` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lyrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `melodies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`description` text NOT NULL,
	`melodyType` varchar(50) NOT NULL,
	`melodyData` text,
	`weight` float NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `melodies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userPreferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`preferredLanguages` varchar(255) NOT NULL DEFAULT 'zh',
	`allowMixedLanguage` boolean NOT NULL DEFAULT true,
	`defaultMelodyType` varchar(50) NOT NULL DEFAULT 'text',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userPreferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `userPreferences_userId_unique` UNIQUE(`userId`)
);
