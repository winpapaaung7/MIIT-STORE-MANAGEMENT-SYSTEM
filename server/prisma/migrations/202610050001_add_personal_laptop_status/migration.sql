ALTER TABLE `student`
  ADD COLUMN `personal_laptop_status` VARCHAR(20) NOT NULL DEFAULT 'None';

ALTER TABLE `users`
  ADD COLUMN `personal_laptop_status` VARCHAR(20) NOT NULL DEFAULT 'None';
