-- Keep the existing email-OTP protection enabled for all current accounts.
ALTER TABLE `users`
  ADD COLUMN `two_step_enabled` TINYINT(1) NOT NULL DEFAULT 1;
