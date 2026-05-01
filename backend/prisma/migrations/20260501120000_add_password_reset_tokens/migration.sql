CREATE TABLE `password_reset_tokens` (
  `id` varchar(191) NOT NULL,
  `email` varchar(50) NOT NULL,
  `reset_code` varchar(6) NOT NULL,
  `expires_at` datetime(0) NOT NULL,
  `created_at` datetime(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
  PRIMARY KEY (`id`),
  UNIQUE KEY `password_reset_tokens_email_key` (`email`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
