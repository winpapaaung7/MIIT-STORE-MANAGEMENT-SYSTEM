import { Router, type Request, type Response } from "express";

type PrismaLike = any;

const positiveInt = (value: unknown, name: string, maximum = 1000) => {
  if (value === undefined) return undefined;
  if (typeof value !== "string" || !/^\d+$/.test(value)) throw new Error(`Invalid ${name}`);
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > maximum) throw new Error(`Invalid ${name}`);
  return parsed;
};

const keyForStatus = (status: string) => status.trim().toLowerCase().replace(/[ _-]+/g, "");
const statusBucket = (status: string) => {
  const key = keyForStatus(status);
  if (key === "available") return "available";
  if (key === "inuse" || key === "issued" || key === "rented") return "inUse";
  // Damaged, maintenance, and any other stored non-usable status require attention.
  // This keeps every physical item in exactly one dashboard bucket.
  return "damagedMaintenance";
};

export function createDashboardRouter(prisma: PrismaLike) {
  const router = Router();

  router.get("/overview", async (req: Request, res: Response) => {
    try {
      const academicYearId = positiveInt(req.query.academicYearId, "academicYearId");
      const departmentId = positiveInt(req.query.departmentId, "departmentId");
      const activeDepartmentId = positiveInt(req.query.activeDepartmentId, "activeDepartmentId");
      const categoryId = positiveInt(req.query.categoryId, "categoryId");
      const page = positiveInt(req.query.departmentItemsPage, "departmentItemsPage") ?? 1;
      const limit = positiveInt(req.query.departmentItemsLimit, "departmentItemsLimit", 100) ?? 10;
      const recentItemsLimit = positiveInt(req.query.recentItemsLimit, "recentItemsLimit", 50) ?? 5;
      const status = typeof req.query.status === "string" ? req.query.status.trim() : undefined;
      if (req.query.status !== undefined && !status) throw new Error("Invalid status");

      const [year, department, activeDepartment, category, statuses] = await Promise.all([
        academicYearId ? prisma.budget_year.findUnique({ where: { budget_year_id: academicYearId } }) : null,
        departmentId ? prisma.department.findUnique({ where: { department_id: departmentId } }) : null,
        activeDepartmentId ? prisma.department.findUnique({ where: { department_id: activeDepartmentId } }) : null,
        categoryId ? prisma.category.findUnique({ where: { category_id: categoryId } }) : null,
        prisma.item_detail.findMany({ distinct: ["status"], select: { status: true }, orderBy: { status: "asc" } }),
      ]);
      if (academicYearId && !year) return res.status(400).json({ ok: false, message: "Unknown academic year" });
      if (departmentId && !department) return res.status(400).json({ ok: false, message: "Unknown department" });
      if (activeDepartmentId && !activeDepartment) return res.status(400).json({ ok: false, message: "Unknown active department" });
      if (categoryId && !category) return res.status(400).json({ ok: false, message: "Unknown category" });
      if (status && !statuses.some((entry: { status: string }) => entry.status === status)) return res.status(400).json({ ok: false, message: "Unknown status" });

      const where = {
        ...(academicYearId ? { budget_year_id: academicYearId } : {}),
        ...(departmentId ? { current_department_id: departmentId } : {}),
        ...(status ? { status } : {}),
        ...(categoryId ? { item: { category_id: categoryId } } : {}),
      };
      // The side-panel selection is intentionally independent of the dashboard filters.
      // It changes only when a department is selected in the overview chart.
      const selectedDepartmentId = activeDepartmentId;
      const departmentItemsWhere = selectedDepartmentId ? { current_department_id: selectedDepartmentId } : undefined;
      const [totalItems, statusCounts, departmentCounts, itemGroups, academicYears, departments, categories, recentItems] = await Promise.all([
        prisma.item_detail.count({ where }),
        prisma.item_detail.groupBy({ by: ["status"], where, _count: { _all: true } }),
        prisma.item_detail.groupBy({ by: ["current_department_id", "status"], where, _count: { _all: true } }),
        departmentItemsWhere ? prisma.item_detail.groupBy({ by: ["item_id", "status"], where: departmentItemsWhere, _count: { _all: true } }) : [],
        prisma.budget_year.findMany({ select: { budget_year_id: true, year_name: true }, orderBy: { start_date: "desc" } }),
        prisma.department.findMany({ select: { department_id: true, department_name: true, department_code: true }, orderBy: { department_name: "asc" } }),
        prisma.category.findMany({ select: { category_id: true, category_name: true }, orderBy: { category_name: "asc" } }),
        prisma.item.findMany({ take: recentItemsLimit, orderBy: { created_at: "desc" }, include: { category: { select: { category_name: true } }, _count: { select: { item_detail: true } } } }),
      ]);
      const summary = { totalItems, available: 0, inUse: 0, damagedMaintenance: 0 };
      for (const entry of statusCounts) {
        summary[statusBucket(entry.status)] += entry._count._all;
      }
      // A count of item_detail rows is the source of truth for physical units.
      if (summary.totalItems !== summary.available + summary.inUse + summary.damagedMaintenance) {
        throw new Error("Dashboard summary counts are inconsistent");
      }
      const pct = (value: number) => totalItems ? Math.round((value / totalItems) * 1000) / 10 : 0;
      const departmentMap = new Map(departments.map((d: any) => [d.department_id, d]));
      const overview = new Map<number, any>();
      for (const row of departmentCounts) {
        if (row.current_department_id === null) continue;
        const id = row.current_department_id;
        if (!overview.has(id)) overview.set(id, { departmentId: id, departmentName: (departmentMap.get(id) as any)?.department_name ?? "Unassigned", available: 0, inUse: 0, damagedMaintenance: 0, total: 0 });
        const target = overview.get(id); const type = statusBucket(row.status);
        target[type] += row._count._all;
        target.total += row._count._all;
      }
      // Seed from the department table so valid departments with zero units are returned once.
      for (const departmentRow of departments) overview.set(departmentRow.department_id, overview.get(departmentRow.department_id) ?? { departmentId: departmentRow.department_id, departmentName: departmentRow.department_name, available: 0, inUse: 0, damagedMaintenance: 0, total: 0 });
      // Items without a current location remain part of the dashboard totals.  They are
      // represented only in this response, never inserted into the department table.
      const unassignedRows = departmentCounts.filter((row: any) => row.current_department_id === null);
      if (unassignedRows.length) {
        const unassigned = { departmentId: null, departmentName: "Unassigned", available: 0, inUse: 0, damagedMaintenance: 0, total: 0 };
        for (const row of unassignedRows) {
          unassigned[statusBucket(row.status)] += row._count._all;
          unassigned.total += row._count._all;
        }
        overview.set(-1, unassigned);
      }
      const departmentSummary = [...overview.values()].reduce((totals, row) => ({
        available: totals.available + row.available,
        inUse: totals.inUse + row.inUse,
        damagedMaintenance: totals.damagedMaintenance + row.damagedMaintenance,
        total: totals.total + row.total,
      }), { available: 0, inUse: 0, damagedMaintenance: 0, total: 0 });
      if (departmentSummary.total !== summary.totalItems || departmentSummary.available !== summary.available || departmentSummary.inUse !== summary.inUse || departmentSummary.damagedMaintenance !== summary.damagedMaintenance) {
        throw new Error("Department dashboard counts are inconsistent");
      }
      const itemTotals = new Map<string, any>();
      for (const row of itemGroups) {
        if (!itemTotals.has(row.item_id)) itemTotals.set(row.item_id, { available: 0, inUse: 0, damagedMaintenance: 0, total: 0 });
        const target = itemTotals.get(row.item_id); const type = statusBucket(row.status);
        target[type] += row._count._all;
        target.total += row._count._all;
      }
      const ids = [...itemTotals.keys()]; const totalItemRecords = ids.length;
      const pageIds = ids.slice((page - 1) * limit, page * limit);
      const catalogue = pageIds.length ? await prisma.item.findMany({ where: { item_id: { in: pageIds } }, include: { category: { select: { category_name: true } } } }) : [];
      const itemById = new Map(catalogue.map((item: any) => [item.item_id, item]));
      const pagedItems = pageIds.map((id) => { const item = itemById.get(id) as any; const totals = itemTotals.get(id); return { itemId: id, itemCode: item?.item_code ?? id, itemName: item?.item_name ?? "Unknown item", category: item?.category?.category_name ?? "Uncategorised", ...totals }; });

      const selectedOverview = selectedDepartmentId ? overview.get(selectedDepartmentId) : null;
      const orderedOverview = [...overview.values()].sort((a, b) => { if (a.departmentName.toLowerCase() === "store") return -1; if (b.departmentName.toLowerCase() === "store") return 1; return a.departmentName.localeCompare(b.departmentName); });
      res.json({ ok: true, summary: { ...summary, availablePercentage: pct(summary.available), inUsePercentage: pct(summary.inUse), damagedMaintenancePercentage: pct(summary.damagedMaintenance) }, inventoryHealth: { healthPercentage: pct(summary.available), available: summary.available, inUse: summary.inUse, damagedMaintenance: summary.damagedMaintenance, total: summary.totalItems }, departmentOverview: orderedOverview, departmentItems: { selectedDepartment: selectedDepartmentId ? { id: selectedDepartmentId, name: activeDepartment?.department_name } : null, totalPhysicalUnits: selectedOverview?.total ?? 0, items: pagedItems, pagination: { page, limit, totalItems: totalItemRecords, totalPages: Math.ceil(totalItemRecords / limit) } }, recentItems: recentItems.map((item: any) => ({ itemId: item.item_id, itemCode: item.item_code, itemName: item.item_name, category: item.category.category_name, imageUrl: item.image_url, quantity: item._count.item_detail, createdAt: item.created_at })), filterOptions: { academicYears: academicYears.map((y: any) => ({ id: y.budget_year_id, name: y.year_name })), departments: departments.map((d: any) => ({ id: d.department_id, name: d.department_name, code: d.department_code })), categories: categories.map((c: any) => ({ id: c.category_id, name: c.category_name })), statuses: statuses.map((s: any) => s.status) } });
    } catch (error) {
      const message = error instanceof Error && error.message.startsWith("Invalid") ? error.message : "Unable to load dashboard overview";
      res.status(message.startsWith("Invalid") ? 400 : 500).json({ ok: false, message });
    }
  });
  return router;
}
