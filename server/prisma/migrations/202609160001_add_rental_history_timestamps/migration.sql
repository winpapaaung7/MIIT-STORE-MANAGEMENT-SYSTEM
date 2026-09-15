-- Preserve the exact time a laptop is issued or returned. Existing date-only
-- values are retained as midnight because the original time was not stored.
ALTER TABLE `laptop_rental`
  MODIFY `issue_date` DATETIME(0) NOT NULL,
  MODIFY `return_date` DATETIME(0) NULL;
