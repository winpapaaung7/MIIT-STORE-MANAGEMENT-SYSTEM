import { detailCodeForSerial, latestDetailSerial } from "./detail-code.js";

export async function createInventoryDetails(prisma: any, itemId: string, quantity: number, fields: Record<string, unknown>, audit?: { action: "created" | "updated"; name: string; actor: string; details: Record<string, unknown> }) {
  if (!Number.isSafeInteger(quantity) || quantity < 1) throw new Error("Quantity must be a positive whole number");
  return prisma.$transaction(async (tx: any) => {
    // Serialize allocations for this item across API processes and requests.
    await tx.$queryRaw`SELECT item_id FROM item WHERE item_id = ${itemId} FOR UPDATE`;
    const quantityBefore = await tx.item_detail.count({ where: { item_id: itemId } });
    const latest = await tx.item_detail.findFirst({ where: { item_id: itemId }, orderBy: { detail_code: "desc" }, select: { detail_code: true } });
    const serial = latestDetailSerial(itemId, latest?.detail_code);
    const rows = Array.from({ length: quantity }, (_, index) => ({ ...fields, item_id: itemId, detail_code: detailCodeForSerial(itemId, serial + index + 1) }));
    await tx.item_detail.createMany({ data: rows });
    const codes = rows.map((row) => row.detail_code);
    const created = await tx.item_detail.findMany({ where: { detail_code: { in: codes } }, select: { item_detail_id: true, detail_code: true } });
    await tx.qr_code.createMany({ data: created.map((row: any) => ({ qr_code_id: row.detail_code, item_detail_id: row.item_detail_id, is_active: true })) });
    const totalQuantity = await tx.item_detail.count({ where: { item_id: itemId } });
    if (audit) await tx.activity_log.create({ data: {
      action: audit.action, module: "Inventory", target_type: "Item", target_id: itemId,
      target_name: audit.name, actor_name: audit.actor, created_at: new Date(),
      details: JSON.stringify({ ...audit.details, added_units: quantity, quantity_before: quantityBefore, quantity_after: totalQuantity, qr_codes: codes, quantity_verified: true }),
    } });
    return { codes, totalQuantity, quantityBefore };
  }, { isolationLevel: "ReadCommitted", maxWait: 30_000, timeout: 120_000 });
}
