CREATE TABLE `RestoreChapterMapping` (
	`restoreRunId` text NOT NULL,
	`backupNovelId` integer NOT NULL,
	`backupChapterId` integer NOT NULL,
	`restoredNovelId` integer NOT NULL,
	`restoredChapterId` integer NOT NULL,
	CONSTRAINT `fk_RestoreChapterMapping_restoredNovelId_Novel_id_fk` FOREIGN KEY (`restoredNovelId`) REFERENCES `Novel`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_RestoreChapterMapping_restoredChapterId_Chapter_id_fk` FOREIGN KEY (`restoredChapterId`) REFERENCES `Chapter`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_Chapter` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`novelId` integer NOT NULL,
	`path` text NOT NULL,
	`name` text NOT NULL,
	`releaseTime` text,
	`bookmark` integer DEFAULT false,
	`unread` integer DEFAULT true,
	`readTime` text,
	`isDownloaded` integer DEFAULT false,
	`updatedTime` text,
	`chapterNumber` real,
	`page` text DEFAULT '1',
	`position` integer DEFAULT 0,
	`progress` integer,
	`scanlator` text,
	`timeSpent` integer DEFAULT 0,
	CONSTRAINT `fk_Chapter_novelId_Novel_id_fk` FOREIGN KEY (`novelId`) REFERENCES `Novel`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
INSERT INTO `__new_Chapter`(`id`, `novelId`, `path`, `name`, `releaseTime`, `bookmark`, `unread`, `readTime`, `isDownloaded`, `updatedTime`, `chapterNumber`, `page`, `position`, `progress`, `scanlator`, `timeSpent`) SELECT `id`, `novelId`, `path`, `name`, `releaseTime`, `bookmark`, `unread`, `readTime`, `isDownloaded`, `updatedTime`, `chapterNumber`, `page`, `position`, `progress`, `scanlator`, `timeSpent` FROM `Chapter`;--> statement-breakpoint
DROP TABLE `Chapter`;--> statement-breakpoint
ALTER TABLE `__new_Chapter` RENAME TO `Chapter`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `chapter_novel_path_unique` ON `Chapter` (`novelId`,`path`);--> statement-breakpoint
CREATE INDEX `chapterNovelIdIndex` ON `Chapter` (`novelId`,`position`,`page`,`id`);--> statement-breakpoint
CREATE UNIQUE INDEX `restore_chapter_mapping_unique` ON `RestoreChapterMapping` (`restoreRunId`,`backupNovelId`,`backupChapterId`);--> statement-breakpoint
CREATE INDEX `restore_chapter_mapping_novel_index` ON `RestoreChapterMapping` (`restoreRunId`,`backupNovelId`);