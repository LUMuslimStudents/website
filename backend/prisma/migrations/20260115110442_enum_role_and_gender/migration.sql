/*
  Warnings:

  - You are about to alter the column `role` on the `users` table. The data in that column could be lost. The data in that column will be cast from `VarChar(5)` to `Enum(EnumId(0))`.
  - Added the required column `gender` to the `pending_signups` table without a default value. This is not possible if the table is not empty.
  - Added the required column `gender` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `pending_signups` ADD COLUMN `gender` ENUM('male', 'female') NOT NULL;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `gender` ENUM('male', 'female') NOT NULL,
    MODIFY `role` ENUM('user', 'admin') NOT NULL DEFAULT 'user';
