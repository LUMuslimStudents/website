ALTER TABLE `events_info`
ADD COLUMN `is_published` BOOLEAN NOT NULL DEFAULT TRUE AFTER `poster`;
