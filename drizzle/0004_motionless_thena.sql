CREATE TABLE `horses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`saleId` int NOT NULL,
	`lotNumber` int NOT NULL,
	`horseName` varchar(256),
	`sex` enum('牡','牝','セン'),
	`color` varchar(64),
	`birthDate` timestamp,
	`sireName` varchar(256),
	`damName` varchar(256),
	`consignor` varchar(256),
	`breeder` varchar(256),
	`height` decimal(5,2),
	`girth` decimal(5,2),
	`cannon` decimal(5,2),
	`priceEstimate` int,
	`photoUrl` varchar(512),
	`videoUrl` varchar(512),
	`pedigreePdfUrl` varchar(512),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `horses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `popularityStats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`horseId` int NOT NULL,
	`countExcellent` int NOT NULL DEFAULT 0,
	`countGood` int NOT NULL DEFAULT 0,
	`countFair` int NOT NULL DEFAULT 0,
	`lastUpdated` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `popularityStats_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sales` (
	`id` int AUTO_INCREMENT NOT NULL,
	`saleCode` varchar(32) NOT NULL,
	`saleName` varchar(256) NOT NULL,
	`saleDate` timestamp NOT NULL,
	`catalogUrl` varchar(512),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sales_id` PRIMARY KEY(`id`),
	CONSTRAINT `sales_saleCode_unique` UNIQUE(`saleCode`)
);
--> statement-breakpoint
CREATE TABLE `userCheckItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`saleId` int NOT NULL,
	`itemName` varchar(256) NOT NULL,
	`itemType` enum('boolean','numeric') NOT NULL,
	`score` int NOT NULL,
	`criteria` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userCheckItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userCheckResults` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userCheckId` int NOT NULL,
	`checkItemId` int NOT NULL,
	`isChecked` boolean NOT NULL,
	`scoreApplied` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userCheckResults_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userChecks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`horseId` int NOT NULL,
	`evaluation` enum('◎','○','△'),
	`memo` text,
	`isEliminated` boolean NOT NULL DEFAULT false,
	`totalScore` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userChecks_id` PRIMARY KEY(`id`)
);
