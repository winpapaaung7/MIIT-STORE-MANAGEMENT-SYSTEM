import { expect, it } from "vitest";
import { myanmarDateBoundary, verifiedActivityDetails } from "../src/inventory/activity-information.js";

it("converts Myanmar calendar filters to UTC boundaries", () => {
  expect(myanmarDateBoundary("2026-10-06")).toBe("2026-10-05 17:30:00");
  expect(myanmarDateBoundary("2026-10-06", true)).toBe("2026-10-06 17:30:00");
});
it("does not present inconsistent old serial-based stock totals as real counts", () => {
  const original = { added_units: 400, quantity_before: 1861, quantity_after: 2526, qr_codes: ["0008-002127"] };
  const details = verifiedActivityDetails(original);
  expect(details).not.toHaveProperty("quantity_after");
  expect(details).not.toHaveProperty("quantity_before");
  expect(details).toHaveProperty("quantity_warning");
  expect(details).toHaveProperty("added_units", 400);
  expect(original.quantity_after).toBe(2526);
});
it("preserves valid counts", () => {
  const details = { added_units: 2, quantity_before: 73, quantity_after: 75 };
  expect(verifiedActivityDetails(details)).toEqual(details);
});
it("shows stored UTC time in Myanmar without subtracting twice", () => {
  const time = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Yangon", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date("2026-10-06T10:34:48Z"));
  expect(time).toBe("17:04");
});
