-- Non-destructive authentication foundation.
-- Before applying to a populated database, review legacy roles that do not
-- have a stable role_code. This migration deliberately preserves them as NULL.

ALTER TABLE `role` ADD COLUMN `role_code` VARCHAR(50) NULL;
ALTER TABLE `role` ADD UNIQUE INDEX `role_code` (`role_code`);

UPDATE `role`
SET `role_code` = CASE LOWER(`role_name`)
  WHEN 'admin' THEN 'ADMIN'
  WHEN 'administrator' THEN 'ADMIN'
  WHEN 'department head' THEN 'DEPARTMENT_HEAD'
  WHEN 'laptop rental' THEN 'LAPTOP_RENTAL'
  ELSE `role_code`
END
WHERE `role_code` IS NULL;

ALTER TABLE `users`
  ADD COLUMN `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN `department_head_of_id` INT NULL,
  ADD UNIQUE INDEX `users_department_head_of_id_key` (`department_head_of_id`),
  ADD CONSTRAINT `fk_users_department_head_of`
    FOREIGN KEY (`department_head_of_id`) REFERENCES `department`(`department_id`);

CREATE TABLE `refresh_token` (
  `refresh_token_id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `token_hash` CHAR(64) NOT NULL,
  `expires_at` DATETIME(0) NOT NULL,
  `revoked_at` DATETIME(0) NULL,
  `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`refresh_token_id`),
  UNIQUE INDEX `refresh_token_hash` (`token_hash`),
  INDEX `idx_refresh_token_user` (`user_id`),
  INDEX `idx_refresh_token_expires_at` (`expires_at`),
  CONSTRAINT `fk_refresh_token_user` FOREIGN KEY (`user_id`)
    REFERENCES `users`(`user_id`) ON DELETE CASCADE
);
