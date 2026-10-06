import { Router } from "express";

const normalizeString = (value: unknown) => typeof value === "string" ? value.trim() : "";

async function getScopedDepartmentId(prisma: any, req: any) {
  if (req.auth?.role.code === "DEPARTMENT_HEAD") return req.auth.department?.id;
  if (req.auth?.role.code !== "LAPTOP_RENTAL") return undefined;
  const itsm = await prisma.department.findFirst({
    where: { OR: [{ department_code: "ITSM" }, { department_name: { contains: "(ITSM)" } }] },
    select: { department_id: true },
  });
  return itsm?.department_id ?? null;
}

export function createItemDetailsRouter(prisma: any, recordActivity: any) {
  const router = Router();
router.get("/", async (req, res) => {
  try {
    const text = normalizeString(req.query.search), category = normalizeString(req.query.category), itemName = normalizeString(req.query.itemName), department = normalizeString(req.query.department), room = normalizeString(req.query.room), academicYear = normalizeString(req.query.academicYear), date = normalizeString(req.query.date), status = normalizeString(req.query.status);
    if (date && (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(new Date(`${date}T00:00:00.000Z`).getTime()))) {
      return res.status(400).json({ ok: false, message: "Invalid date" });
    }
    const dateStart = date ? new Date(`${date}T00:00:00.000Z`) : null;
    const dateEnd = dateStart ? new Date(dateStart) : null;
    if (dateEnd) dateEnd.setUTCDate(dateEnd.getUTCDate() + 1);
    const page = Math.max(1, Number(req.query.page) || 1), limit = Math.min(1000, Math.max(1, Number(req.query.limit) || 50));
    const scopedDepartmentId = await getScopedDepartmentId(prisma, req);
    if (scopedDepartmentId === null) return res.status(503).json({ ok: false, message: "ITSM department is not configured." });
    const isRentalRole = req.auth?.role.code === "LAPTOP_RENTAL";
    const roomWhere = room
      ? { room: { building_name: room === "Room number not assigned" || room === "Unknown" ? null : room } }
      : {};
    const conditions: any[] = [
      ...(isRentalRole && scopedDepartmentId
        ? [{
            OR: [
              { current_department_id: scopedDepartmentId, ...roomWhere },
              {
                item: { category: { rental_allowed: true } },
                OR: [{ current_department_id: { not: scopedDepartmentId } }, { current_department_id: null }],
              },
            ],
          }]
        : [
            ...(scopedDepartmentId ? [{ current_department_id: scopedDepartmentId }] : []),
            ...(!scopedDepartmentId && department ? [{ department: { department_name: department } }] : []),
            ...(room ? [roomWhere] : []),
          ]),
      ...(text ? [{ OR: [{ detail_code: { contains: text } }, { notes: { contains: text } }, { item: { item_name: { contains: text } } }] }] : []),
      ...(category ? [{ item: { category: { category_name: category } } }] : []),
      ...(itemName ? [{ item: { item_name: itemName } }] : []),
      ...(academicYear ? [{ budget_year: { year_name: academicYear } }] : []),
      ...(dateStart && dateEnd ? [{ OR: [
        { purchase_date: { gte: dateStart, lt: dateEnd } },
        { purchase_date: null, created_at: { gte: dateStart, lt: dateEnd } },
      ] }] : []),
      ...(status ? [{ status }] : []),
    ];
    const where = conditions.length ? { AND: conditions } : {};
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
      select: { item_detail_id: true, current_department_id: true },
    });

    if (!itemDetail) {
      res.status(404).json({
        ok: false,
        message: "Item detail not found",
      });
      return;
    }

    if (req.auth?.role.code === "DEPARTMENT_HEAD" && itemDetail.current_department_id !== req.auth.department?.id) {
      res.status(404).json({ ok: false, message: "Item detail not found" });
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
router.delete("/:detailCode", async (req, res) => {
  try {
    const detailCode = normalizeString(req.params.detailCode);
    if (!detailCode) {
      return res.status(400).json({ ok: false, message: "Item detail code is required." });
    }

    const itemDetail = await prisma.item_detail.findUnique({
      where: { detail_code: detailCode },
      include: { item: { select: { item_name: true } } },
    });
    if (!itemDetail) {
      return res.status(404).json({ ok: false, message: "Item detail not found." });
    }

    if (req.auth?.role.code === "DEPARTMENT_HEAD" && itemDetail.current_department_id !== req.auth.department?.id) {
      return res.status(404).json({ ok: false, message: "Item detail not found." });
    }

    const [rentalCount, transferCount] = await Promise.all([
      prisma.laptop_rental.count({ where: { item_detail_id: itemDetail.item_detail_id } }),
      prisma.transfer_item.count({ where: { item_detail_id: itemDetail.item_detail_id } }),
    ]);
    if (rentalCount || transferCount) {
      return res.status(409).json({
        ok: false,
        message: "This item cannot be deleted because it has rental or transfer history.",
      });
    }

    await prisma.$transaction(async (tx: any) => {
      await tx.item_detail.delete({ where: { item_detail_id: itemDetail.item_detail_id } });
      const remainingUnits = await tx.item_detail.count({ where: { item_id: itemDetail.item_id } });
      if (remainingUnits === 0) {
        await tx.item.delete({ where: { item_id: itemDetail.item_id } });
      }
    });
    await recordActivity(
      "deleted",
      "Inventory",
      { type: "Item detail", id: itemDetail.item_detail_id, name: itemDetail.item.item_name },
      { qr_codes: [itemDetail.detail_code], removed_units: 1 },
    );

    return res.json({ ok: true, message: "Item detail deleted successfully." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      ok: false,
      message: "Failed to delete item detail.",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});
  return router;
}
