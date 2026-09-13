import { Router } from "express";

const normalizeString = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

async function generateNextItemId(prisma: any) {
  const latestItem = await prisma.item.findFirst({ orderBy: { item_id: "desc" } });
  const nextNumeric = latestItem ? Math.max(Number(latestItem.item_id) || 0, 0) + 1 : 1;
  if (nextNumeric > 9999) throw new Error("Cannot create more item IDs because the item_id field is limited to 4 digits.");
  return String(nextNumeric).padStart(4, "0");
}

/** Routes mounted at /api/items. Authentication is applied by app.ts first. */
export function createItemsRouter(prisma: any) {
  const router = Router();

  router.get("/next-generated-id", async (req, res) => {
    try {
      const itemName = normalizeString(req.query.item_name);
      const categoryName = normalizeString(req.query.category_name);
      if (!itemName || !categoryName) return res.status(400).json({ ok: false, message: "item_name and category_name are required" });
      const category = await prisma.category.findFirst({ where: { category_name: categoryName }, select: { category_id: true } });
      if (!category) return res.status(404).json({ ok: false, message: "Category not found" });
      const existingItem = await prisma.item.findFirst({ where: { item_name: itemName, category_id: category.category_id }, select: { item_id: true, _count: { select: { item_detail: true } } } });
      return res.json({ ok: true, item_id: existingItem?.item_id ?? await generateNextItemId(prisma), next_serial: (existingItem?._count.item_detail ?? 0) + 1 });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ ok: false, message: "Failed to generate item ID preview", error: error instanceof Error ? error.message : String(error) });
    }
  });

  router.get("/", async (req, res) => {
    try {
      const items = await prisma.item.findMany({ where: req.auth?.role.code === "DEPARTMENT_HEAD" ? { item_detail: { some: { current_department_id: req.auth.department!.id } } } : undefined, include: { category: true, _count: { select: { item_detail: true } } }, orderBy: { item_id: "asc" } });
      return res.json({ ok: true, items: items.map((item: any) => ({ item_id: item.item_id, item_name: item.item_name, category_name: item.category.category_name, image_url: item.image_url, quantity: item._count.item_detail })) });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ ok: false, message: "Failed to fetch items", error: error instanceof Error ? error.message : String(error) });
    }
  });

  return router;
}
