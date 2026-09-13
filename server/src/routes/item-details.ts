import { Router } from "express";

const normalizeString = (value: unknown) => typeof value === "string" ? value.trim() : "";

export function createItemDetailsRouter(prisma: any, recordActivity: any) {
  const router = Router();
router.get("/", async (req, res) => {
  try {
    const details = await prisma.item_detail.findMany({
      where: req.auth?.role.code === "DEPARTMENT_HEAD" ? { current_department_id: req.auth.department!.id } : undefined,
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
      orderBy: { item_detail_id: "asc" },
    });

    res.json({
      ok: true,
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
