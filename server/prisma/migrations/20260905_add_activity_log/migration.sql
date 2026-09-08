CREATE TABLE `activity_log` (
  `activity_log_id` INT NOT NULL AUTO_INCREMENT,
  `action` VARCHAR(20) NOT NULL,
  `module` VARCHAR(50) NOT NULL,
  `target_type` VARCHAR(50) NOT NULL,
  `target_id` VARCHAR(100) NULL,
  `target_name` VARCHAR(255) NOT NULL,
  `actor_name` VARCHAR(100) NOT NULL,
  `details` TEXT NULL,
  `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

  PRIMARY KEY (`activity_log_id`),
  INDEX `idx_activity_log_action` (`action`),
  INDEX `idx_activity_log_module` (`module`),
  INDEX `idx_activity_log_created_at` (`created_at`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
