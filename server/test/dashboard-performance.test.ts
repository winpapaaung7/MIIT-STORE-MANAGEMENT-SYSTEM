import express from "express";
import { afterAll, beforeAll, expect, it, vi } from "vitest";
import type { Server } from "node:http";
import { createDashboardRouter } from "../src/routes/dashboard.js";

const groupBy = vi.fn(async (args: any) => {
  if (args.by.length === 1) return [{ status: "Available" }, { status: "In Use" }, { status: "Damaged" }];
  return [
    { current_department_id: 1, status: "Available", _count: { _all: 10 } },
    { current_department_id: 1, status: "In Use", _count: { _all: 2 } },
    { current_department_id: null, status: "Damaged", _count: { _all: 1 } },
  ];
});
const p = {
  item_detail: { groupBy, count: vi.fn() },
  budget_year: { findMany: async () => [{ budget_year_id: 1, year_name: "2026-2027" }] },
  department: { findMany: async () => [{ department_id: 1, department_name: "Store", department_code: "ST" }] },
  category: { findMany: async () => [] },
  room: { findMany: async () => [] },
  item: { findMany: async () => [] },
};
let server: Server;
let base: string;
beforeAll(async () => {
  const app = express(); app.use(createDashboardRouter(p));
  server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const address = server.address() as { port: number };
  base = `http://127.0.0.1:${address.port}`;
});
afterAll(async () => { server.closeAllConnections(); await new Promise<void>((resolve) => server.close(() => resolve())); });

it("keeps summary and department totals consistent from one aggregate query", async () => {
  const response = await fetch(`${base}/overview`);
  const body = await response.json();
  expect(response.status).toBe(200);
  expect(body.summary).toMatchObject({ totalItems: 13, available: 10, inUse: 2, damagedMaintenance: 1 });
  expect(body.departmentOverview.reduce((n: number, row: any) => n + row.total, 0)).toBe(13);
  expect(p.item_detail.count).not.toHaveBeenCalled();
});
it("retains filter restrictions in the aggregate", async () => {
  await fetch(`${base}/overview?status=Available&roomId=none`);
  expect(groupBy).toHaveBeenCalledWith(expect.objectContaining({ by: ["current_department_id", "status"], where: { status: "Available", current_room_id: null } }));
});
it("continues rejecting unknown status filters", async () => {
  const response = await fetch(`${base}/overview?status=Unknown`);
  expect(response.status).toBe(400);
});
