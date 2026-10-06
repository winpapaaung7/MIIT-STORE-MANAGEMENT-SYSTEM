import { describe, expect, it, vi } from "vitest";
import { importActivityLogs, parseActivityLogs } from "../src/scripts/activity-seed.js";

const entry = { activity_log_id: 99, action: "created", module: "Department", target_type: "Department", target_id: "1", target_name: "CSE", actor_name: "Admin", details: null, created_at: "2026-10-06T00:00:00.000Z" };
describe("activity history seed", () => {
  it("accepts legacy seed files without inventing history", () => {
    expect(parseActivityLogs({})).toEqual([]);
  });
  it("preserves timestamps and drops source IDs", () => {
    const [row] = parseActivityLogs({ activityLogs: [entry] });
    expect(row.created_at.toISOString()).toBe(entry.created_at);
    expect(row).not.toHaveProperty("activity_log_id");
  });
  it("rejects invalid timestamps and fields", () => {
    expect(() => parseActivityLogs({ activityLogs: [{ ...entry, created_at: "bad" }] })).toThrow();
    expect(() => parseActivityLogs({ activityLogs: [{ ...entry, action: 42 }] })).toThrow();
  });
  it("preserves existing history and skips repeat imports", async () => {
    const rows = parseActivityLogs({ activityLogs: [entry] });
    const stored = [...rows];
    const createMany = vi.fn(async ({ data }) => { stored.push(...data); });
    const tx = { activity_log: { findMany: async () => stored, createMany } };
    const additions = parseActivityLogs({ activityLogs: [entry, { ...entry, target_name: "ECE" }, { ...entry, target_name: "ECE" }] });
    expect(await importActivityLogs(tx, additions)).toBe(1);
    expect(await importActivityLogs(tx, additions)).toBe(0);
    expect(createMany).toHaveBeenCalledTimes(1);
    expect(stored).toHaveLength(2);
  });
});
