-- CreateTable
CREATE TABLE `users` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `first_name` VARCHAR(50) NOT NULL,
    `last_name` VARCHAR(50) NOT NULL,
    `password` VARCHAR(100) NOT NULL,
    `email` VARCHAR(50) NOT NULL,
    `role` VARCHAR(5) NOT NULL DEFAULT 'user',
    `study_program` VARCHAR(50) NOT NULL,
    `phone_number` VARCHAR(15) NOT NULL,
    `created_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `id`(`id`),
    UNIQUE INDEX `email`(`email`),
    UNIQUE INDEX `phone_number`(`phone_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pending_signups` (
    `id` VARCHAR(191) NOT NULL,
    `first_name` VARCHAR(50) NOT NULL,
    `last_name` VARCHAR(50) NOT NULL,
    `email` VARCHAR(50) NOT NULL,
    `phone_number` VARCHAR(15) NOT NULL,
    `password` VARCHAR(100) NOT NULL,
    `study_program` VARCHAR(50) NOT NULL,
    `verifications_completed` JSON NOT NULL,
    `email_verification_code` VARCHAR(6) NULL,
    `email_verification_expires` DATETIME(3) NULL,
    `email_verified_at` DATETIME(3) NULL,
    `payment_verification_code` VARCHAR(50) NULL,
    `payment_verification_expires` DATETIME(3) NULL,
    `payment_verified_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expires_at` DATETIME(0) NOT NULL,

    UNIQUE INDEX `email`(`email`),
    UNIQUE INDEX `phone_number`(`phone_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
