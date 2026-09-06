ALTER TABLE `users`
  ADD COLUMN `language` VARCHAR(5) NOT NULL DEFAULT 'eng' AFTER `status`;
