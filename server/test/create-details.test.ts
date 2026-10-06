import { expect, it, vi } from "vitest";
import { createInventoryDetails } from "../src/inventory/create-details.js";

it("locks before reading the serial and creates details and QR codes atomically", async () => {
  const calls: string[] = [];
  const rows: any[] = [];
  let serial = 338;
  const tx = {
    $queryRaw: vi.fn(async () => { calls.push("lock"); }),
    item_detail: {
      findFirst: vi.fn(async () => { calls.push("read"); return { detail_code: `0006-${String(serial).padStart(6, "0")}` }; }),
      createMany: vi.fn(async ({ data }) => { calls.push("create"); rows.push(...data); serial += data.length; }),
      findMany: vi.fn(async ({ where }) => rows.filter((r) => where.detail_code.in.includes(r.detail_code)).map((r, i) => ({ ...r, item_detail_id: i + 1 }))),
      count: vi.fn(async () => 73 + rows.length),
    },
    qr_code: { createMany: vi.fn(async () => { calls.push("qr"); }) },
  };
  const prisma = { $transaction: vi.fn(async (callback) => callback(tx)) };
  const first = await createInventoryDetails(prisma, "0006", 2, { status: "Available" });
  const second = await createInventoryDetails(prisma, "0006", 1, { status: "Available" });
  expect(first).toEqual({ codes: ["0006-000339", "0006-000340"], totalQuantity: 75, quantityBefore: 73 });
  expect(second.codes).toEqual(["0006-000341"]);
  expect(calls).toEqual(["lock", "read", "create", "qr", "lock", "read", "create", "qr"]);
  expect(prisma.$transaction.mock.calls[0][1]).toMatchObject({ isolationLevel: "ReadCommitted" });
});

it("rejects fractional quantities before opening a transaction", async () => {
  const prisma = { $transaction: vi.fn() };
  await expect(createInventoryDetails(prisma, "0006", 1.5, {})).rejects.toThrow("whole number");
  expect(prisma.$transaction).not.toHaveBeenCalled();
});

it("records the actual locked stock counts and timestamp within the same transaction", async () => {
  const create = vi.fn(async () => {});
  const tx = {
    $queryRaw: vi.fn(async () => {}),
    item_detail: {
      count: vi.fn().mockResolvedValueOnce(73).mockResolvedValueOnce(75),
      findFirst: vi.fn(async () => ({ detail_code: "0006-000338" })),
      createMany: vi.fn(async () => {}),
      findMany: vi.fn(async () => [{ item_detail_id: 1, detail_code: "0006-000339" }, { item_detail_id: 2, detail_code: "0006-000340" }]),
    },
    qr_code: { createMany: vi.fn(async () => {}) },
    activity_log: { create },
  };
  const prisma = { $transaction: async (callback: any) => callback(tx) };
  await createInventoryDetails(prisma, "0006", 2, {}, { action: "updated", name: "Wet Waste Bin", actor: "Admin", details: {} });
  const data = (create.mock.calls[0] as any)[0].data;
  expect(data.created_at).toBeInstanceOf(Date);
  expect(JSON.parse(data.details)).toMatchObject({ added_units: 2, quantity_before: 73, quantity_after: 75, quantity_verified: true });
  create.mockRejectedValueOnce(new Error("Audit unavailable"));
  tx.item_detail.count.mockResolvedValue(75);
  await expect(createInventoryDetails(prisma, "0006", 2, {}, { action: "updated", name: "Wet Waste Bin", actor: "Admin", details: {} })).rejects.toThrow("Audit unavailable");
});
