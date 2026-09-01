-- Adds a new short-lived login OTP table only. No existing rows are changed.
CREATE TABLE `otp_challenge` (
  `otp_challenge_id` CHAR(64) NOT NULL,
  `user_id` INT NOT NULL,
  `otp_hash` CHAR(64) NOT NULL,
  `expires_at` DATETIME(0) NOT NULL,
  `attempt_count` INT NOT NULL DEFAULT 0,
  `max_attempts` INT NOT NULL DEFAULT 5,
  `resend_available_at` DATETIME(0) NOT NULL,
  `used_at` DATETIME(0) NULL,
  `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `request_ip` VARCHAR(64) NULL,
  PRIMARY KEY (`otp_challenge_id`),
  INDEX `idx_otp_challenge_user_created` (`user_id`, `created_at`),
  INDEX `idx_otp_challenge_expires` (`expires_at`),
  CONSTRAINT `fk_otp_challenge_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE
);
