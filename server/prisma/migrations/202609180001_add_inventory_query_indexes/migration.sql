-- Speeds dashboard grouping, department filtering, and active-rental lookups.
CREATE INDEX `idx_item_detail_department_status` ON `item_detail`(`current_department_id`, `status`);
CREATE INDEX `idx_item_detail_budget_department_status` ON `item_detail`(`budget_year_id`, `current_department_id`, `status`);
CREATE INDEX `idx_item_detail_item_department_status` ON `item_detail`(`item_id`, `current_department_id`, `status`);
CREATE INDEX `idx_rental_status_item_detail` ON `laptop_rental`(`rental_status`, `item_detail_id`);
