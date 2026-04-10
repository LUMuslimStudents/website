-- CreateTable
CREATE TABLE `event_registrations` (
    `id` VARCHAR(191) NOT NULL,
    `event_id` INTEGER UNSIGNED NOT NULL,
    `user_id` BIGINT UNSIGNED NULL,
    `status` ENUM('pending', 'confirmed', 'cancelled', 'waitlisted') NOT NULL DEFAULT 'pending',
    `invitation_snapshot` ENUM('members', 'non_members', 'alumni', 'all_students', 'non_students') NOT NULL,
    `siblings_snapshot` ENUM('brothers', 'sisters', 'all') NOT NULL,
    `quoted_price` INTEGER NOT NULL,
    `payment_required` BOOLEAN NOT NULL DEFAULT false,
    `submitted_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `event_registrations_event_id_status_submitted_at_idx`(`event_id`, `status`, `submitted_at`),
    INDEX `event_registrations_user_id_idx`(`user_id`),
    UNIQUE INDEX `uniq_member_registration_per_event`(`event_id`, `user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `event_registration_profiles` (
    `registration_id` VARCHAR(191) NOT NULL,
    `first_name` VARCHAR(50) NOT NULL,
    `last_name` VARCHAR(50) NOT NULL,
    `email` VARCHAR(50) NOT NULL,
    `phone_number` VARCHAR(15) NOT NULL,
    `gender` ENUM('male', 'female') NOT NULL,
    `is_student` BOOLEAN NOT NULL,
    `university_name` VARCHAR(100) NOT NULL,
    `study_program` VARCHAR(100) NULL,
    `is_alumnus` BOOLEAN NOT NULL,

    INDEX `event_registration_profiles_email_phone_number_idx`(`email`, `phone_number`),
    UNIQUE INDEX `uniq_profile_email_phone_registration`(`email`, `phone_number`, `registration_id`),
    PRIMARY KEY (`registration_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `event_form_fields` (
    `id` VARCHAR(191) NOT NULL,
    `event_id` INTEGER UNSIGNED NOT NULL,
    `field_key` VARCHAR(60) NOT NULL,
    `label` VARCHAR(120) NOT NULL,
    `help_text` VARCHAR(255) NULL,
    `field_type` ENUM('short_text', 'checkbox_multi', 'radio_single') NOT NULL,
    `is_required` BOOLEAN NOT NULL DEFAULT false,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `options_json` JSON NULL,
    `config_json` JSON NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `event_form_fields_event_id_sort_order_idx`(`event_id`, `sort_order`),
    UNIQUE INDEX `uniq_event_field_key`(`event_id`, `field_key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `event_registration_field_answers` (
    `id` VARCHAR(191) NOT NULL,
    `registration_id` VARCHAR(191) NOT NULL,
    `field_id` VARCHAR(191) NOT NULL,
    `short_text_value` TEXT NULL,
    `selected_option_value` VARCHAR(120) NULL,
    `selected_options_json` JSON NULL,
    `field_label_snapshot` VARCHAR(120) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `event_registration_field_answers_registration_id_idx`(`registration_id`),
    INDEX `event_registration_field_answers_field_id_idx`(`field_id`),
    UNIQUE INDEX `uniq_registration_answer_per_field`(`registration_id`, `field_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `event_registrations` ADD CONSTRAINT `event_registrations_event_id_fkey` FOREIGN KEY (`event_id`) REFERENCES `events_info`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `event_registration_profiles` ADD CONSTRAINT `event_registration_profiles_registration_id_fkey` FOREIGN KEY (`registration_id`) REFERENCES `event_registrations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `event_form_fields` ADD CONSTRAINT `event_form_fields_event_id_fkey` FOREIGN KEY (`event_id`) REFERENCES `events_info`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `event_registration_field_answers` ADD CONSTRAINT `event_registration_field_answers_registration_id_fkey` FOREIGN KEY (`registration_id`) REFERENCES `event_registrations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `event_registration_field_answers` ADD CONSTRAINT `event_registration_field_answers_field_id_fkey` FOREIGN KEY (`field_id`) REFERENCES `event_form_fields`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

