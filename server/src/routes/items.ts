import { Router } from "express";

const normalizeString = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

async function getScopedDepartmentId(prisma: any, req: any) {
  if (req.auth?.role.code === "DEPARTMENT_HEAD") return req.auth.department?.id;
  if (req.auth?.role.code !== "LAPTOP_RENTAL") return undefined;
  const itsm = await prisma.department.findFirst({
    where: { OR: [{ department_code: "ITSM" }, { department_name: { contains: "(ITSM)" } }] },
    select: { department_id: true },
  });
  return itsm?.department_id ?? null;
}

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

  // A complete catalogue for item-name filters. Unlike the paginated items
  // endpoint, this always includes newly created items and items with no
  // detail rows on the current Accessories page.
  router.get("/filter-options", async (_req, res) => {
    try {
      const scopedDepartmentId = await getScopedDepartmentId(prisma, _req);
      if (scopedDepartmentId === null) return res.status(503).json({ ok: false, message: "ITSM department is not configured." });
      const items = await prisma.item.findMany({
        where: scopedDepartmentId ? { item_detail: { some: { current_department_id: scopedDepartmentId } } } : undefined,
        select: {
          item_name: true,
          category: { select: { category_name: true } },
        },
        orderBy: [{ item_name: "asc" }, { item_id: "asc" }],
      });
      res.json({
        ok: true,
        items: items.map((item: any) => ({
          name: item.item_name,
          category: item.category.category_name,
        })),
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ ok: false, message: "Failed to load item filter options" });
    }
  });

  router.get("/", async (req, res) => {
    try {
      const search = normalizeString(req.query.search), category = normalizeString(req.query.category), department = normalizeString(req.query.department), room = normalizeString(req.query.room), page = Math.max(1, Number(req.query.page) || 1), limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
      const scopedDepartmentId = await getScopedDepartmentId(prisma, req);
      if (scopedDepartmentId === null) return res.status(503).json({ ok: false, message: "ITSM department is not configured." });
      const isRentalDashboard = req.auth?.role.code === "LAPTOP_RENTAL" && Boolean(scopedDepartmentId);
      const departmentDetailWhere = scopedDepartmentId || department || room
        ? {
            ...(scopedDepartmentId ? { current_department_id: scopedDepartmentId } : department ? { department: { department_name: department } } : {}),
            ...(room ? { room: { building_name: room === "Room number not assigned" ? null : room } } : {}),
          }
        : undefined;
      // Rental laptops can be issued from locations outside ITSM.  The rental
      // dashboard must therefore show both the selected ITSM room inventory
      // and all centrally managed laptop units (with their item images).
      const rentalLaptopDetailWhere = isRentalDashboard
        ? { OR: [{ current_department_id: { not: scopedDepartmentId } }, { current_department_id: null }] }
        : undefined;
      const where = {
        ...(search ? { OR: [{ item_id: { contains: search } }, { item_name: { contains: search } }] } : {}),
        ...(category ? { category: { category_name: category } } : {}),
        ...(isRentalDashboard
          ? {
              OR: [
                ...(departmentDetailWhere ? [{ item_detail: { some: departmentDetailWhere } }] : []),
                { category: { rental_allowed: true }, item_detail: { some: rentalLaptopDetailWhere } },
              ],
            }
          : departmentDetailWhere ? { item_detail: { some: departmentDetailWhere } } : {}),
      };
      const itemDetailWhere = isRentalDashboard
        ? { OR: [departmentDetailWhere, rentalLaptopDetailWhere].filter(Boolean) }
        : departmentDetailWhere;
      const [items, total] = await Promise.all([
        prisma.item.findMany({
          where,
          include: { category: true, item_detail: { where: itemDetailWhere } },
          orderBy: { item_id: "asc" },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.item.count({ where }),
      ]);
      return res.json({
        ok: true,
        items: items.map((item: any) => {
          const localUnits = item.item_detail.filter((detail: any) =>
            !scopedDepartmentId || detail.current_department_id === scopedDepartmentId,
          );
          return {
            item_id: item.item_id,
            item_name: item.item_name,
            category_name: item.category.category_name,
            image_url: item.image_url,
            quantity: isRentalDashboard && item.category.rental_allowed
              ? item.item_detail.length
              : localUnits.length,
          };
        }),
        pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ ok: false, message: "Failed to fetch items", error: error instanceof Error ? error.message : String(error) });
    }
  });

  return router;
}
