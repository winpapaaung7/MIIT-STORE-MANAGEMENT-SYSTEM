-- CreateTable
CREATE TABLE `budget_year` (
    `budget_year_id` INTEGER NOT NULL AUTO_INCREMENT,
    `year_name` VARCHAR(20) NOT NULL,
    `start_date` DATE NOT NULL,
    `end_date` DATE NOT NULL,
    `status` VARCHAR(20) NOT NULL,

    PRIMARY KEY (`budget_year_id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `category` (
    `category_id` INTEGER NOT NULL AUTO_INCREMENT,
    `category_name` VARCHAR(100) NOT NULL,
    `description` VARCHAR(255) NULL,
    `rental_allowed` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`category_id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `department` (
    `department_id` INTEGER NOT NULL AUTO_INCREMENT,
    `department_code` VARCHAR(10) NOT NULL,
    `department_name` VARCHAR(255) NOT NULL,
    `description` VARCHAR(255) NULL,

    UNIQUE INDEX `department_code`(`department_code` ASC),
    PRIMARY KEY (`department_id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `item` (
    `item_id` CHAR(4) NOT NULL,
    `item_code` CHAR(4) NOT NULL,
    `item_name` VARCHAR(100) NOT NULL,
    `category_id` INTEGER NOT NULL,
    `brand` VARCHAR(100) NULL,
    `model` VARCHAR(100) NULL,
    `description` VARCHAR(255) NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `image_url` VARCHAR(255) NULL,

    INDEX `idx_item_category`(`category_id` ASC),
    UNIQUE INDEX `item_code`(`item_code` ASC),
    PRIMARY KEY (`item_id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `item_detail` (
    `item_detail_id` INTEGER NOT NULL AUTO_INCREMENT,
    `item_id` CHAR(4) NOT NULL,
    `detail_code` CHAR(255) NOT NULL,
    `current_department_id` INTEGER NULL,
    `budget_year_id` INTEGER NOT NULL,
    `status` VARCHAR(30) NOT NULL,
    `purchase_date` DATE NULL,
    `notes` VARCHAR(255) NULL,
    `current_room_id` INTEGER NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `detail_code`(`detail_code` ASC),
    INDEX `idx_item_detail_budget`(`budget_year_id` ASC),
    INDEX `idx_item_detail_department`(`current_department_id` ASC),
    INDEX `idx_item_detail_item`(`item_id` ASC),
    INDEX `idx_item_detail_room`(`current_room_id` ASC),
    PRIMARY KEY (`item_detail_id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `laptop_rental` (
    `rental_id` INTEGER NOT NULL AUTO_INCREMENT,
    `student_id` INTEGER NULL,
    `teacher_user_id` INTEGER NULL,
    `item_detail_id` INTEGER NOT NULL,
    `semester_id` INTEGER NOT NULL,
    `issued_by` INTEGER NOT NULL,
    `issue_date` DATE NOT NULL,
    `due_date` DATE NOT NULL,
    `return_date` DATE NULL,
    `rental_status` VARCHAR(20) NOT NULL,
    `condition_out` VARCHAR(30) NULL,
    `condition_in` VARCHAR(30) NULL,
    `remarks` VARCHAR(255) NULL,

    INDEX `idx_rental_issued_by`(`issued_by` ASC),
    INDEX `idx_rental_item_detail`(`item_detail_id` ASC),
    INDEX `idx_rental_semester`(`semester_id` ASC),
    INDEX `idx_rental_student`(`student_id` ASC),
    INDEX `idx_rental_teacher`(`teacher_user_id` ASC),
    PRIMARY KEY (`rental_id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `qr_code` (
    `qr_code_id` VARCHAR(20) NOT NULL,
    `item_detail_id` INTEGER NOT NULL,
    `generated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `is_active` BOOLEAN NOT NULL DEFAULT true,

    INDEX `idx_qr_item_detail`(`item_detail_id` ASC),
    PRIMARY KEY (`qr_code_id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `role` (
    `role_id` INTEGER NOT NULL AUTO_INCREMENT,
    `role_name` VARCHAR(50) NOT NULL,

    UNIQUE INDEX `role_name`(`role_name` ASC),
    PRIMARY KEY (`role_id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `room` (
    `room_id` INTEGER NOT NULL AUTO_INCREMENT,
    `department_id` INTEGER NOT NULL,
    `building_name` VARCHAR(100) NULL,
    `description` VARCHAR(255) NULL,
    `status` BOOLEAN NOT NULL DEFAULT true,

    INDEX `idx_room_department`(`department_id` ASC),
    PRIMARY KEY (`room_id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `semester` (
    `semester_id` INTEGER NOT NULL AUTO_INCREMENT,
    `academic_year` VARCHAR(20) NOT NULL,
    `semester_name` VARCHAR(30) NOT NULL,
    `start_date` DATE NOT NULL,
    `end_date` DATE NOT NULL,
    `status` VARCHAR(20) NOT NULL,
    `budget_year_id` INTEGER NULL,

    INDEX `idx_semester_budget_year`(`budget_year_id` ASC),
    PRIMARY KEY (`semester_id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `student` (
    `student_id` INTEGER NOT NULL AUTO_INCREMENT,
    `student_name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(150) NULL,
    `phone` VARCHAR(30) NULL,
    `batch` VARCHAR(30) NULL,
    `status` VARCHAR(20) NOT NULL,
    `roll_number` VARCHAR(20) NULL,
    `major` VARCHAR(20) NULL,

    PRIMARY KEY (`student_id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `transfer` (
    `transfer_id` INTEGER NOT NULL AUTO_INCREMENT,
    `transfer_code` VARCHAR(30) NOT NULL,
    `from_department_id` INTEGER NOT NULL,
    `from_room_id` INTEGER NULL,
    `to_department_id` INTEGER NOT NULL,
    `to_room_id` INTEGER NULL,
    `initiated_by` INTEGER NOT NULL,
    `received_by` INTEGER NULL,
    `transfer_date` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `received_date` DATETIME(0) NULL,
    `transfer_status` VARCHAR(20) NOT NULL,
    `remarks` VARCHAR(255) NULL,

    INDEX `fk_transfer_from_room`(`from_room_id` ASC),
    INDEX `fk_transfer_to_room`(`to_room_id` ASC),
    INDEX `idx_transfer_from_department`(`from_department_id` ASC),
    INDEX `idx_transfer_initiated_by`(`initiated_by` ASC),
    INDEX `idx_transfer_received_by`(`received_by` ASC),
    INDEX `idx_transfer_to_department`(`to_department_id` ASC),
    UNIQUE INDEX `transfer_code`(`transfer_code` ASC),
    PRIMARY KEY (`transfer_id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `transfer_item` (
    `transfer_item_id` INTEGER NOT NULL AUTO_INCREMENT,
    `transfer_id` INTEGER NOT NULL,
    `item_detail_id` INTEGER NOT NULL,
    `condition_before` VARCHAR(30) NULL,
    `condition_after` VARCHAR(30) NULL,
    `item_status` VARCHAR(20) NULL,
    `remarks` VARCHAR(255) NULL,

    INDEX `idx_transfer_item_item_detail`(`item_detail_id` ASC),
    INDEX `idx_transfer_item_transfer`(`transfer_id` ASC),
    UNIQUE INDEX `uq_transfer_item`(`transfer_id` ASC, `item_detail_id` ASC),
    PRIMARY KEY (`transfer_item_id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `user_id` INTEGER NOT NULL AUTO_INCREMENT,
    `full_name` VARCHAR(100) NOT NULL,
    `username` VARCHAR(150) NOT NULL,
    `email` VARCHAR(150) NOT NULL,
    `phone` VARCHAR(30) NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `role_id` INTEGER NOT NULL,
    `department_id` INTEGER NULL,
    `status` VARCHAR(20) NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `email`(`email` ASC),
    INDEX `idx_users_department`(`department_id` ASC),
    INDEX `idx_users_role`(`role_id` ASC),
    UNIQUE INDEX `username`(`username` ASC),
    PRIMARY KEY (`user_id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `item` ADD CONSTRAINT `fk_item_category` FOREIGN KEY (`category_id`) REFERENCES `category`(`category_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `item_detail` ADD CONSTRAINT `fk_item_detail_budget` FOREIGN KEY (`budget_year_id`) REFERENCES `budget_year`(`budget_year_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `item_detail` ADD CONSTRAINT `fk_item_detail_department` FOREIGN KEY (`current_department_id`) REFERENCES `department`(`department_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `item_detail` ADD CONSTRAINT `fk_item_detail_item` FOREIGN KEY (`item_id`) REFERENCES `item`(`item_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `item_detail` ADD CONSTRAINT `fk_item_detail_room` FOREIGN KEY (`current_room_id`) REFERENCES `room`(`room_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `laptop_rental` ADD CONSTRAINT `fk_rental_issued_by` FOREIGN KEY (`issued_by`) REFERENCES `users`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `laptop_rental` ADD CONSTRAINT `fk_rental_item_detail` FOREIGN KEY (`item_detail_id`) REFERENCES `item_detail`(`item_detail_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `laptop_rental` ADD CONSTRAINT `fk_rental_semester` FOREIGN KEY (`semester_id`) REFERENCES `semester`(`semester_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `laptop_rental` ADD CONSTRAINT `fk_rental_student` FOREIGN KEY (`student_id`) REFERENCES `student`(`student_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `laptop_rental` ADD CONSTRAINT `fk_rental_teacher` FOREIGN KEY (`teacher_user_id`) REFERENCES `users`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `qr_code` ADD CONSTRAINT `fk_qr_code_item_detail` FOREIGN KEY (`item_detail_id`) REFERENCES `item_detail`(`item_detail_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `room` ADD CONSTRAINT `fk_room_department` FOREIGN KEY (`department_id`) REFERENCES `department`(`department_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transfer` ADD CONSTRAINT `fk_transfer_from_department` FOREIGN KEY (`from_department_id`) REFERENCES `department`(`department_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transfer` ADD CONSTRAINT `fk_transfer_from_room` FOREIGN KEY (`from_room_id`) REFERENCES `room`(`room_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transfer` ADD CONSTRAINT `fk_transfer_initiated_by` FOREIGN KEY (`initiated_by`) REFERENCES `users`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transfer` ADD CONSTRAINT `fk_transfer_received_by` FOREIGN KEY (`received_by`) REFERENCES `users`(`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transfer` ADD CONSTRAINT `fk_transfer_to_department` FOREIGN KEY (`to_department_id`) REFERENCES `department`(`department_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transfer` ADD CONSTRAINT `fk_transfer_to_room` FOREIGN KEY (`to_room_id`) REFERENCES `room`(`room_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transfer_item` ADD CONSTRAINT `fk_transfer_item_item_detail` FOREIGN KEY (`item_detail_id`) REFERENCES `item_detail`(`item_detail_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transfer_item` ADD CONSTRAINT `fk_transfer_item_transfer` FOREIGN KEY (`transfer_id`) REFERENCES `transfer`(`transfer_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `fk_users_department` FOREIGN KEY (`department_id`) REFERENCES `department`(`department_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `fk_users_role` FOREIGN KEY (`role_id`) REFERENCES `role`(`role_id`) ON DELETE RESTRICT ON UPDATE CASCADE;
