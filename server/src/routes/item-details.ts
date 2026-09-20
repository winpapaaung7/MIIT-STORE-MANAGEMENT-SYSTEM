import { Router } from "express";

const normalizeString = (value: unknown) => typeof value === "string" ? value.trim() : "";

export function createItemDetailsRouter(prisma: any, recordActivity: any) {
  const router = Router();
router.get("/", async (req, res) => {
  try {
    const text = normalizeString(req.query.search), category = normalizeString(req.query.category), itemName = normalizeString(req.query.itemName), department = normalizeString(req.query.department), room = normalizeString(req.query.room), academicYear = normalizeString(req.query.academicYear), status = normalizeString(req.query.status);
    const page = Math.max(1, Number(req.query.page) || 1), limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
    const where = {
      ...(text ? { OR: [{ detail_code: { contains: text } }, { notes: { contains: text } }, { item: { item_name: { contains: text } } }] } : {}),
      ...(category ? { item: { category: { category_name: category } } } : {}),
      ...(itemName ? { item: { item_name: itemName } } : {}),
      ...(department ? { department: { department_name: department } } : {}),
      ...(room ? { room: { building_name: room } } : {}),
      ...(academicYear ? { budget_year: { year_name: academicYear } } : {}),
      ...(status ? { status } : {}),
    };
    const [details, total] = await Promise.all([prisma.item_detail.findMany({
      where,
      include: {
        item: {
          include: {
            category: true,
          },
        },
        room: {
          include: {
            department: true,
          },
        },
        department: true,
        budget_year: true,
      },
      orderBy: { item_detail_id: "asc" }, skip: (page - 1) * limit, take: limit,
    }), prisma.item_detail.count({ where })]);

    res.json({
      ok: true,
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
      items: details.map((detail: any) => ({
        id: detail.detail_code,
        item_name: detail.item.item_name,
        category_name: detail.item.category.category_name,
        status: detail.status,
        department:
          detail.department?.department_name ??
          detail.room?.department.department_name ??
          "Store",
        room: detail.room?.building_name ?? "",
        academic_year: detail.budget_year.year_name,
        registered_date:
          detail.purchase_date?.toISOString().split("T")[0] ??
          detail.created_at.toISOString().split("T")[0],
        created_at: detail.created_at.toISOString(),
        remark: detail.notes ?? "",
      })),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      ok: false,
      message: "Failed to fetch accessory details",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});
router.put("/:detailCode", async (req, res) => {
  try {
    const detailCode = normalizeString(req.params.detailCode);
    const status = normalizeString(req.body.status);
    const remark =
      typeof req.body.remark === "string" ? req.body.remark.trim() : "";
    const allowedStatuses = ["Available", "In Use", "Damaged"];

    if (!detailCode || !allowedStatuses.includes(status)) {
      res.status(400).json({
        ok: false,
        message: "A valid item detail code and status are required",
      });
      return;
    }

    if (remark.length > 255) {
      res.status(400).json({
        ok: false,
        message: "Remark must not exceed 255 characters",
      });
      return;
    }

    const itemDetail = await prisma.item_detail.findUnique({
      where: { detail_code: detailCode },
      select: { item_detail_id: true },
    });

    if (!itemDetail) {
      res.status(404).json({
        ok: false,
        message: "Item detail not found",
      });
      return;
    }

    await prisma.item_detail.update({
      where: { item_detail_id: itemDetail.item_detail_id },
      data: {
        status,
        notes: remark || null,
      },
    });

    res.json({ ok: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      ok: false,
      message: "Failed to update accessory details",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});
  return router;
}
