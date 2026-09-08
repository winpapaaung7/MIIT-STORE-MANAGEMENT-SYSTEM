import "dotenv/config";
import express from "express";
import cors from "cors";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { PrismaClient } from "./generated/prisma/client.js";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { createDashboardRouter } from "./routes/dashboard.js";
import { createAuthRouter } from "./routes/auth.js";
import { createUsersRouter } from "./routes/users.js";
import { apiAuthorization, requireDepartmentScope } from "./auth/middleware.js";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set");
}

const prisma = new PrismaClient({
  adapter: new PrismaMariaDb(databaseUrl),
});

const app = express();
const allowedOrigins = (process.env.CLIENT_ORIGIN ?? "http://localhost:5173,http://localhost:4173").split(",").map((origin) => origin.trim());
app.use(cors({ origin: (origin, callback) => callback(null, !origin || allowedOrigins.includes(origin)), credentials: true }));
app.use(express.json({ limit: "6mb" }));
app.use("/api/auth", createAuthRouter(prisma));
app.use("/api", apiAuthorization(prisma));
app.use("/api/users", createUsersRouter(prisma));
app.use("/api/dashboard", createDashboardRouter(prisma));

const uploadsDirectory = path.resolve("uploads");
app.use("/uploads", express.static(uploadsDirectory));

async function saveItemImage(itemId: string, imageData: string) {
  const match = imageData.match(
    /^data:image\/(png|jpeg|gif|webp);base64,([A-Za-z0-9+/=]+)$/,
  );

  if (!match) {
    throw new Error("Image must be a PNG, JPEG, GIF, or WebP file");
  }

  const [, imageType, encodedImage] = match;
  const imageBuffer = Buffer.from(encodedImage, "base64");

  if (imageBuffer.length === 0 || imageBuffer.length > 4 * 1024 * 1024) {
    throw new Error("Image must be between 1 byte and 4 MB");
  }

  await mkdir(uploadsDirectory, { recursive: true });

  const extension = imageType === "jpeg" ? "jpg" : imageType;
  const fileName = `item-${itemId}-${Date.now()}.${extension}`;
  await writeFile(path.join(uploadsDirectory, fileName), imageBuffer);

  return `/uploads/${fileName}`;
}

async function saveProfileImage(userId: number, imageData: string) {
  const match = imageData.match(
    /^data:image\/(png|jpeg|gif|webp);base64,([A-Za-z0-9+/=]+)$/,
  );

  if (!match) {
    throw new Error("Image must be a PNG, JPEG, GIF, or WebP file");
  }

  const [, imageType, encodedImage] = match;
  const imageBuffer = Buffer.from(encodedImage, "base64");

  if (imageBuffer.length === 0 || imageBuffer.length > 4 * 1024 * 1024) {
    throw new Error("Image must be between 1 byte and 4 MB");
  }

  await mkdir(uploadsDirectory, { recursive: true });

  const extension = imageType === "jpeg" ? "jpg" : imageType;
  const fileName = `profile-${userId}-${Date.now()}.${extension}`;
  await writeFile(path.join(uploadsDirectory, fileName), imageBuffer);

  return `/uploads/${fileName}`;
}

function formatProfile(user: {
  user_id: number;
  full_name: string;
  email: string;
  phone: string | null;
  status: string;
  language: string;
  image_url: string | null;
  role: { role_name: string };
  department: { department_name: string } | null;
}, req: express.Request) {
  const origin = `${req.protocol}://${req.get("host")}`;

  return {
    id: user.user_id,
    name: user.full_name,
    email: user.email,
    phone: user.phone ?? "",
    role: user.role.role_name,
    department: user.department?.department_name ?? "",
    status: user.status,
    language: user.language === "mm" ? "mm" : "eng",
    image: user.image_url ? `${origin}${user.image_url}` : "",
  };
}

function buildDepartmentCode(departmentName: string) {
  const code = departmentName.replace(/[^a-z0-9]/gi, "").toUpperCase();

  return (code || "DEPT").slice(0, 10);
}

async function findOrCreateDepartment(departmentName: string) {
  const existingDepartment = await prisma.department.findFirst({
    where: {
      department_name: departmentName,
    },
  });

  if (existingDepartment) {
    return existingDepartment;
  }

  const baseCode = buildDepartmentCode(departmentName);
  let departmentCode = baseCode;
  let suffix = 1;

  while (
    await prisma.department.findUnique({
      where: { department_code: departmentCode },
    })
  ) {
    const suffixText = String(suffix);
    departmentCode = `${baseCode.slice(0, 10 - suffixText.length)}${suffixText}`;
    suffix += 1;
  }

  return prisma.department.create({
    data: {
      department_code: departmentCode,
      department_name: departmentName,
    },
  });
}

type AuditAction = "created" | "updated" | "deleted";

type ActivityDetails = Record<string, unknown>;

async function recordActivity(
  action: AuditAction,
  module: string,
  target: { type: string; id?: string | number; name: string },
  details?: ActivityDetails,
) {
  try {
    // Until authentication is added, the active profile is the user performing changes.
    const actor = await prisma.users.findFirst({
      where: { status: "Active" },
      orderBy: { user_id: "asc" },
      select: { full_name: true },
    });

    await prisma.$executeRawUnsafe(
      "INSERT INTO activity_log (action, module, target_type, target_id, target_name, actor_name, details) VALUES (?, ?, ?, ?, ?, ?, ?)",
      action,
      module,
      target.type,
      target.id === undefined ? null : String(target.id),
      target.name,
      actor?.full_name ?? "System",
      details ? JSON.stringify(details) : null,
    );
  } catch (error) {
    // Audit logging must never prevent a successful inventory or settings change.
    console.error("Failed to record activity", error);
  }
}

function parseActivityDetails(value: unknown) {
  if (typeof value !== "string" || !value) return null;

  try {
    return JSON.parse(value) as ActivityDetails;
  } catch {
    return null;
  }
}

app.get("/test-db", async (req, res) => {
  try {
    const usersCount = await prisma.users.count();
    res.json({
      ok: true,
      message: "DB connection works",
      usersCount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      ok: false,
      message: "Database connection failed",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

app.get("/api/activity-log", async (req, res) => {
  try {
    const action = normalizeString(req.query.action).toLowerCase();
    const module = normalizeString(req.query.module);
    const search = normalizeString(req.query.search);
    const from = normalizeString(req.query.from);
    const to = normalizeString(req.query.to);
    const where: string[] = [];
    const values: unknown[] = [];

    if (["created", "updated", "deleted"].includes(action)) {
      where.push("action = ?");
      values.push(action);
    }
    if (module) {
      where.push("module = ?");
      values.push(module);
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(from)) {
      where.push("created_at >= ?");
      values.push(`${from} 00:00:00`);
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(to)) {
      where.push("created_at < DATE_ADD(?, INTERVAL 1 DAY)");
      values.push(to);
    }
    if (search) {
      where.push("(target_name LIKE ? OR actor_name LIKE ? OR details LIKE ?)");
      const term = `%${search}%`;
      values.push(term, term, term);
    }

    const rows = await prisma.$queryRawUnsafe<Array<{
      activity_log_id: number;
      action: AuditAction;
      module: string;
      target_type: string;
      target_id: string | null;
      target_name: string;
      actor_name: string;
      details: string | null;
      created_at: Date;
    }>>(
      `SELECT activity_log_id, action, module, target_type, target_id, target_name, actor_name, details, created_at
       FROM activity_log${where.length ? ` WHERE ${where.join(" AND ")}` : ""}
       ORDER BY created_at DESC, activity_log_id DESC
       LIMIT 250`,
      ...values,
    );

    res.json({
      ok: true,
      activities: rows.map((row) => ({ ...row, details: parseActivityDetails(row.details) })),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, message: "Failed to load activity history." });
  }
});

app.get("/api/profile", async (req, res) => {
  try {
    const user = await prisma.users.findFirst({
      where: { status: "Active" },
      include: { role: true, department: true },
      orderBy: { user_id: "asc" },
    });

    if (!user) {
      return res.status(404).json({ ok: false, message: "No active user profile was found." });
    }

    res.json({ ok: true, profile: formatProfile(user, req) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, message: "Failed to load profile." });
  }
});

app.put("/api/preferences/language", async (req, res) => {
  const language = req.body.language === "mm" ? "mm" : req.body.language === "eng" ? "eng" : null;

  if (!language) {
    return res.status(400).json({ ok: false, message: "Language must be 'eng' or 'mm'." });
  }

  try {
    const currentUser = await prisma.users.findFirst({
      where: { status: "Active" },
      orderBy: { user_id: "asc" },
    });

    if (!currentUser) {
      return res.status(404).json({ ok: false, message: "No active user profile was found." });
    }

    await prisma.users.update({
      where: { user_id: currentUser.user_id },
      data: { language },
    });

    res.json({ ok: true, language });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, message: "Failed to save language preference." });
  }
});

app.put("/api/profile", async (req, res) => {
  const name = normalizeString(req.body.name);
  const email = normalizeString(req.body.email).toLowerCase();
  const phone = normalizeString(req.body.phone);
  const departmentName = normalizeString(req.body.department);
  const image = typeof req.body.image === "string" ? req.body.image : undefined;

  if (!name || !email || !/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ ok: false, message: "Provide a full name and valid email address." });
  }

  try {
    const currentUser = await prisma.users.findFirst({
      where: { status: "Active" },
      orderBy: { user_id: "asc" },
    });

    if (!currentUser) {
      return res.status(404).json({ ok: false, message: "No active user profile was found." });
    }

    const department = departmentName ? await findOrCreateDepartment(departmentName) : null;
    const imageUrl = image === ""
      ? null
      : image?.startsWith("data:image/")
        ? await saveProfileImage(currentUser.user_id, image)
        : undefined;

    const user = await prisma.users.update({
      where: { user_id: currentUser.user_id },
      data: {
        full_name: name,
        email,
        phone: phone || null,
        department_id: department?.department_id ?? null,
        ...(imageUrl !== undefined ? { image_url: imageUrl } : {}),
      },
      include: { role: true, department: true },
    });

    const changedFields = {
      ...(currentUser.full_name !== name ? { name: { from: currentUser.full_name, to: name } } : {}),
      ...(currentUser.email !== email ? { email: { from: currentUser.email, to: email } } : {}),
      ...(currentUser.phone !== (phone || null) ? { phone: { from: currentUser.phone, to: phone || null } } : {}),
      ...(imageUrl !== undefined ? { profile_image: "updated" } : {}),
    };
    await recordActivity("updated", "Profile", {
      type: "User profile",
      id: user.user_id,
      name: user.full_name,
    }, changedFields);

    res.json({ ok: true, profile: formatProfile(user, req) });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error && error.message.includes("Unique constraint")
      ? "That email address is already in use."
      : error instanceof Error && error.message.startsWith("Image")
        ? error.message
        : "Failed to save profile.";
    res.status(409).json({ ok: false, message });
  }
});

app.get("/api/categories", async (_req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { category_id: "asc" },
    });

    res.json({
      ok: true,
      categories,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      ok: false,
      message: "Failed to fetch categories",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

app.get("/api/academic-years", async (_req, res) => {
  try {
    const years = await prisma.budget_year.findMany({
      include: { semester: { orderBy: { start_date: "asc" } }, _count: { select: { item_detail: true } } },
      orderBy: { start_date: "desc" },
    });
    res.json({ ok: true, years });
  } catch (error) {
    res.status(500).json({ ok: false, message: "Failed to fetch academic years" });
  }
});

app.post("/api/academic-years", async (req, res) => {
  const year_name = normalizeString(req.body.year_name);
  const start_date = new Date(req.body.start_date);
  const end_date = new Date(req.body.end_date);
  const status = normalizeString(req.body.status) === "Active" ? "Active" : "Inactive";
  if (!year_name || Number.isNaN(start_date.getTime()) || Number.isNaN(end_date.getTime()) || start_date >= end_date) return res.status(400).json({ ok: false, message: "Provide a name and a valid academic-year date range." });
  try {
    const year = await prisma.$transaction(async (tx) => {
      if (status === "Active") await tx.budget_year.updateMany({ where: { status: "Active" }, data: { status: "Inactive" } });
      return tx.budget_year.create({ data: { year_name, start_date, end_date, status } });
    });
    await recordActivity("created", "Academic year", {
      type: "Academic year",
      id: year.budget_year_id,
      name: year.year_name,
    }, { start_date: year.start_date, end_date: year.end_date, status: year.status });
    res.status(201).json({ ok: true, year });
  } catch { res.status(409).json({ ok: false, message: "Unable to create academic year." }); }
});

app.post("/api/academic-years/:id/semesters", async (req, res) => {
  const budget_year_id = Number(req.params.id);
  const semester_name = normalizeString(req.body.semester_name);
  const start_date = new Date(req.body.start_date);
  const end_date = new Date(req.body.end_date);
  const status = normalizeString(req.body.status) || "Inactive";
  if (!Number.isInteger(budget_year_id) || !semester_name || Number.isNaN(start_date.getTime()) || Number.isNaN(end_date.getTime()) || start_date >= end_date) return res.status(400).json({ ok: false, message: "Provide a semester name and valid dates." });
  try {
    const year = await prisma.budget_year.findUnique({ where: { budget_year_id } });
    if (!year) return res.status(404).json({ ok: false, message: "Academic year not found." });
    if (start_date < year.start_date || end_date > year.end_date) return res.status(400).json({ ok: false, message: "Semester dates must be inside the academic-year range." });
    const semester = await prisma.semester.create({ data: { budget_year_id, academic_year: year.year_name, semester_name, start_date, end_date, status } });
    res.status(201).json({ ok: true, semester });
  } catch { res.status(409).json({ ok: false, message: "Unable to create semester." }); }
});

app.put("/api/academic-years/:id", async (req, res) => {
  const budget_year_id = Number(req.params.id);
  const year_name = normalizeString(req.body.year_name);
  const start_date = new Date(req.body.start_date);
  const end_date = new Date(req.body.end_date);
  const status = normalizeString(req.body.status) === "Active" ? "Active" : "Inactive";
  if (!Number.isInteger(budget_year_id) || !year_name || Number.isNaN(start_date.getTime()) || Number.isNaN(end_date.getTime()) || start_date >= end_date) return res.status(400).json({ ok: false, message: "Provide a name and valid dates." });
  try {
    const previousYear = await prisma.budget_year.findUnique({ where: { budget_year_id } });
    if (!previousYear) return res.status(404).json({ ok: false, message: "Academic year not found." });
    const year = await prisma.$transaction(async (tx) => {
      if (status === "Active") await tx.budget_year.updateMany({ where: { status: "Active", NOT: { budget_year_id } }, data: { status: "Inactive" } });
      return tx.budget_year.update({ where: { budget_year_id }, data: { year_name, start_date, end_date, status } });
    });
    await recordActivity("updated", "Academic year", {
      type: "Academic year",
      id: year.budget_year_id,
      name: year.year_name,
    }, {
      year_name: { from: previousYear.year_name, to: year.year_name },
      start_date: { from: previousYear.start_date, to: year.start_date },
      end_date: { from: previousYear.end_date, to: year.end_date },
      status: { from: previousYear.status, to: year.status },
    });
    res.json({ ok: true, year });
  } catch { res.status(404).json({ ok: false, message: "Academic year not found." }); }
});

app.delete("/api/academic-years/:id", async (req, res) => {
  const budget_year_id = Number(req.params.id);
  if (!Number.isInteger(budget_year_id)) return res.status(400).json({ ok: false, message: "Invalid academic year." });
  const year = await prisma.budget_year.findUnique({ where: { budget_year_id }, include: { _count: { select: { item_detail: true, semester: true } } } });
  if (!year) return res.status(404).json({ ok: false, message: "Academic year not found." });
  if (year._count.item_detail || year._count.semester) return res.status(409).json({ ok: false, message: "This academic year has linked records and cannot be deleted." });
  await prisma.budget_year.delete({ where: { budget_year_id } });
  await recordActivity("deleted", "Academic year", {
    type: "Academic year",
    id: year.budget_year_id,
    name: year.year_name,
  }, { start_date: year.start_date, end_date: year.end_date, status: year.status });
  res.json({ ok: true });
});

app.post("/api/categories", async (req, res) => {
  try {
    const categoryName =
      typeof req.body.category_name === "string"
        ? req.body.category_name.trim()
        : "";

    if (!categoryName) {
      res.status(400).json({
        ok: false,
        message: "category_name is required",
      });
      return;
    }

    const category = await prisma.category.create({
      data: {
        category_name: categoryName,
        description:
          typeof req.body.description === "string"
            ? req.body.description.trim() || null
            : null,
        rental_allowed: Boolean(req.body.rental_allowed),
      },
    });

    res.status(201).json({
      ok: true,
      category,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      ok: false,
      message: "Failed to create category",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

async function getDefaultBudgetYear() {
  let budgetYear = await prisma.budget_year.findFirst({
    where: { status: "Active" },
  });

  if (!budgetYear) {
    const now = new Date();
    const currentYear = now.getFullYear();

    budgetYear = await prisma.budget_year.create({
      data: {
        year_name: String(currentYear),
        start_date: new Date(currentYear, 0, 1),
        end_date: new Date(currentYear, 11, 31),
        status: "Active",
      },
    });
  }

  return budgetYear;
}

async function getDefaultStoreLocation() {
  let storeDepartment = await prisma.department.findFirst({
    where: { department_name: "Store" },
  });

  if (!storeDepartment) {
    storeDepartment = await prisma.department.create({
      data: {
        department_code: buildDepartmentCode("Store"),
        department_name: "Store",
      },
    });
  }

  let storeRoom = await prisma.room.findFirst({
    where: {
      department_id: storeDepartment.department_id,
      building_name: "Storage",
    },
  });

  if (!storeRoom) {
    storeRoom = await prisma.room.create({
      data: {
        department_id: storeDepartment.department_id,
        building_name: "Storage",
        status: true,
      },
    });
  }

  return {
    department: storeDepartment,
    room: storeRoom,
  };
}

async function generateNextItemId() {
  const latestItem = await prisma.item.findFirst({
    orderBy: { item_id: "desc" },
  });

  const nextNumeric = latestItem
    ? Math.max(Number(latestItem.item_id) || 0, 0) + 1
    : 1;

  if (nextNumeric > 9999) {
    throw new Error(
      "Cannot create more item IDs because the item_id field is limited to 4 digits.",
    );
  }

  return String(nextNumeric).padStart(4, "0");
}

function validateItemId(itemId: string) {
  return typeof itemId === "string" && itemId.length === 4;
}

app.get("/api/items/next-generated-id", async (req, res) => {
  try {
    const itemName = normalizeString(req.query.item_name);
    const categoryName = normalizeString(req.query.category_name);

    if (!itemName || !categoryName) {
      res.status(400).json({
        ok: false,
        message: "item_name and category_name are required",
      });
      return;
    }

    const category = await prisma.category.findFirst({
      where: { category_name: categoryName },
      select: { category_id: true },
    });

    if (!category) {
      res.status(404).json({ ok: false, message: "Category not found" });
      return;
    }

    const existingItem = await prisma.item.findFirst({
      where: {
        item_name: itemName,
        category_id: category.category_id,
      },
      select: {
        item_id: true,
        _count: {
          select: { item_detail: true },
        },
      },
    });

    res.json({
      ok: true,
      item_id: existingItem?.item_id ?? (await generateNextItemId()),
      next_serial: (existingItem?._count.item_detail ?? 0) + 1,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      ok: false,
      message: "Failed to generate item ID preview",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

app.get("/api/departments", async (req, res) => {
  try {
    const rooms = await prisma.room.findMany({
      where: req.auth?.role.code === "DEPARTMENT_HEAD" ? { department_id: req.auth.department!.id } : undefined,
      include: {
        department: true,
      },
      orderBy: { room_id: "asc" },
    });

    res.json({
      ok: true,
      departments: rooms.map((room) => ({
        id: room.room_id,
        department_id: room.department_id,
        department: room.department.department_name,
        classroom: room.building_name ?? "",
        status: room.status ? "Available" : "Closed",
      })),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      ok: false,
      message: "Failed to fetch departments",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

app.post("/api/departments", async (req, res) => {
  try {
    const departmentName =
      typeof req.body.department === "string" ? req.body.department.trim() : "";
    const classroom =
      typeof req.body.classroom === "string" ? req.body.classroom.trim() : "";
    const status = req.body.status === "Closed" ? false : true;

    if (!departmentName || !classroom) {
      res.status(400).json({
        ok: false,
        message: "department and classroom are required",
      });
      return;
    }

    const existingRoom = await prisma.room.findFirst({
      where: { building_name: classroom },
      select: { room_id: true },
    });

    if (existingRoom) {
      res.status(409).json({
        ok: false,
        message: "This room is already assigned to another department.",
      });
      return;
    }

    const department = await findOrCreateDepartment(departmentName);

    const room = await prisma.room.create({
      data: {
        department_id: department.department_id,
        building_name: classroom,
        status,
      },
      include: {
        department: true,
      },
    });

    await recordActivity("created", "Department", {
      type: "Department room",
      id: room.room_id,
      name: `${room.department.department_name} — ${room.building_name ?? "Unassigned room"}`,
    }, { status: room.status ? "Available" : "Closed" });

    res.status(201).json({
      ok: true,
      department: {
        id: room.room_id,
        department: room.department.department_name,
        classroom: room.building_name ?? "",
        status: room.status ? "Available" : "Closed",
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      ok: false,
      message: "Failed to create department",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

app.post("/api/qr-codes/backfill", async (_req, res) => {
  try {
    const missingDetails = await prisma.item_detail.findMany({
      where: {
        qr_code: {
          none: {},
        },
      },
      select: {
        detail_code: true,
      },
    });

    const detailCodes = missingDetails.map((detail) => detail.detail_code);
    const createdCount = await createQrCodesForDetailCodes(detailCodes);

    res.json({
      ok: true,
      created: createdCount,
      message: `${createdCount} QR code(s) created for existing item details.`,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      ok: false,
      message: "Failed to create QR codes for existing items",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

app.get("/api/qr-codes/:id", async (req, res) => {
  try {
    const qrCodeId = normalizeString(req.params.id);

    if (!qrCodeId) {
      res.status(400).json({
        ok: false,
        message: "QR code id is required",
      });
      return;
    }

    let qrCode = await prisma.qr_code.findUnique({
      where: { qr_code_id: qrCodeId },
      include: {
        item_detail: {
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
        },
      },
    });

    if (!qrCode && /^[0-9]+$/.test(qrCodeId)) {
      const numericId = Number(qrCodeId);
      const itemDetail = await prisma.item_detail.findUnique({
        where: { item_detail_id: numericId },
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
      });

      if (itemDetail) {
        if (!requireDepartmentScope(itemDetail.current_department_id, res, req.auth)) return;
        await createQrCodeForItemDetailId(numericId);

        qrCode = await prisma.qr_code.findUnique({
          where: { qr_code_id: qrCodeId },
          include: {
            item_detail: {
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
            },
          },
        });
      }
    }

    if (!qrCode) {
      const itemDetail = await prisma.item_detail.findUnique({
        where: { detail_code: qrCodeId },
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
      });

      if (itemDetail) {
        if (!requireDepartmentScope(itemDetail.current_department_id, res, req.auth)) return;
        await createQrCodesForDetailCodes([qrCodeId]);

        return res.json({
          ok: true,
          qr_code: qrCodeId,
          item_detail: {
            id: itemDetail.detail_code,
            item_name: itemDetail.item.item_name,
            category_name: itemDetail.item.category.category_name,
            status: itemDetail.status,
            department:
              itemDetail.department?.department_name ??
              itemDetail.room?.department.department_name ??
              "Store",
            room: itemDetail.room?.building_name ?? "",
            academic_year: itemDetail.budget_year.year_name,
            registered_date:
              itemDetail.purchase_date?.toISOString().split("T")[0] ??
              itemDetail.created_at.toISOString().split("T")[0],
            remark: itemDetail.notes ?? "",
          },
        });
      }

      qrCode = await prisma.qr_code.findUnique({
        where: { qr_code_id: qrCodeId },
        include: {
          item_detail: {
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
          },
        },
      });
    }

    if (!qrCode) {
      res.status(404).json({
        ok: false,
        message: "QR code not found",
      });
      return;
    }

    const detail = qrCode.item_detail;
    if (!requireDepartmentScope(detail.current_department_id, res, req.auth)) return;

    res.json({
      ok: true,
      qr_code: qrCode.qr_code_id,
      item_detail: {
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
        remark: detail.notes ?? "",
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      ok: false,
      message: "Failed to fetch QR code data",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

app.get("/api/items", async (req, res) => {
  try {
    const items = await prisma.item.findMany({
      where: req.auth?.role.code === "DEPARTMENT_HEAD" ? { item_detail: { some: { current_department_id: req.auth.department!.id } } } : undefined,
      include: {
        category: true,
        _count: {
          select: {
            item_detail: true,
          },
        },
      },
      orderBy: { item_id: "asc" },
    });

    res.json({
      ok: true,
      items: items.map((item) => ({
        item_id: item.item_id,
        item_name: item.item_name,
        category_name: item.category.category_name,
        image_url: item.image_url,
        quantity: item._count.item_detail,
      })),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      ok: false,
      message: "Failed to fetch items",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

app.get("/api/item-details", async (req, res) => {
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
      items: details.map((detail) => ({
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

app.get("/api/accessories/by-code/:code", async (req, res) => {
  try {
    const detailCode = normalizeString(req.params.code);

    if (!detailCode) {
      res.status(404).json({ ok: false, message: "Accessory not found" });
      return;
    }

    const detail = await prisma.item_detail.findUnique({
      where: { detail_code: detailCode },
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
        laptop_rental: {
          where: { rental_status: { in: ["pending", "approved", "active", "issued"] } },
          orderBy: { issue_date: "desc" },
          take: 1,
          include: { student: true, teacher: true },
        },
      },
    });

    if (!detail) {
      res.status(404).json({ ok: false, message: "Accessory not found" });
      return;
    }

    const activeRental = detail.item.category.category_name.toLowerCase() === "laptop" ? detail.laptop_rental[0] : null;
    res.json({
      ok: true,
      accessory: {
        item_detail_id: detail.item_detail_id,
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
        borrower_name: activeRental?.student?.student_name ?? activeRental?.teacher?.full_name ?? null,
        borrower_id: activeRental?.student?.roll_number ?? activeRental?.teacher?.email ?? null,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      ok: false,
      message: "Failed to fetch accessory",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

app.put("/api/item-details/:detailCode", async (req, res) => {
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

app.get("/api/students", async (_req, res) => {
  const students = await prisma.student.findMany({
    orderBy: { roll_number: "asc" },
    include: {
      laptop_rental: {
        orderBy: { rental_id: "desc" },
        take: 1,
        select: { rental_status: true },
      },
    },
  });

  res.json({
    ok: true,
    students: students.map(({ laptop_rental, ...student }) => ({
      ...student,
      laptop_status: laptop_rental[0]?.rental_status ?? "No Rental",
    })),
  });
});

app.post("/api/students/import", async (req, res) => {
  const rows = Array.isArray(req.body.students) ? req.body.students : [];
  const valid = rows.map((row: any) => ({ student_name: normalizeString(row.student_name), roll_number: normalizeString(row.roll_number), email: normalizeString(row.email) || null, phone: normalizeString(row.phone) || null, major: normalizeString(row.major) || null, batch: normalizeString(row.batch) || null, status: normalizeString(row.status) || "Active" })).filter((row: any) => row.student_name && row.roll_number);
  if (!valid.length) return res.status(400).json({ ok: false, message: "No valid student rows were provided" });
  const uniqueRows: any[] = Array.from(new Map<string, any>(valid.map((row: any) => [row.roll_number.toLowerCase(), row])).values());
  const existing = await prisma.student.findMany({ where: { roll_number: { in: uniqueRows.map((row: any) => row.roll_number) } }, select: { roll_number: true } });
  const existingRolls = new Set(existing.map((student) => student.roll_number?.toLowerCase()));
  const newRows = uniqueRows.filter((row: any) => !existingRolls.has(row.roll_number.toLowerCase()));
  if (newRows.length) await prisma.student.createMany({ data: newRows });
  res.json({ ok: true, imported: newRows.length, skipped: valid.length - newRows.length });
});

app.post("/api/students", async (req, res) => {
  const student_name = normalizeString(req.body.student_name); const roll_number = normalizeString(req.body.roll_number);
  if (!student_name || !roll_number) return res.status(400).json({ ok: false, message: "Student name and roll number are required" });
  try { const student = await prisma.student.create({ data: { student_name, roll_number, email: normalizeString(req.body.email) || null, phone: normalizeString(req.body.phone) || null, major: normalizeString(req.body.major) || null, batch: normalizeString(req.body.batch) || null, status: normalizeString(req.body.status) || "Active" } }); res.json({ ok: true, student }); }
  catch { res.status(409).json({ ok: false, message: "Roll number or email already exists" }); }
});

app.put("/api/students/:id", async (req, res) => {
  const student_id = Number(req.params.id);
  const student_name = normalizeString(req.body.student_name);
  const roll_number = normalizeString(req.body.roll_number);
  if (!Number.isInteger(student_id) || !student_name || !roll_number) return res.status(400).json({ ok: false, message: "Student name and roll number are required" });
  try {
    const student = await prisma.student.update({ where: { student_id }, data: { student_name, roll_number, email: normalizeString(req.body.email) || null, phone: normalizeString(req.body.phone) || null, major: normalizeString(req.body.major) || null, batch: normalizeString(req.body.batch) || null, status: normalizeString(req.body.status) || "Active" } });
    res.json({ ok: true, student });
  } catch {
    res.status(409).json({ ok: false, message: "Unable to update student. Check roll number and email." });
  }
});

app.delete("/api/students/:id", async (req, res) => {
  const id = Number(req.params.id); if (!Number.isInteger(id)) return res.status(400).json({ ok: false });
  await prisma.student.delete({ where: { student_id: id } }); res.json({ ok: true });
});

app.get("/api/teachers", async (_req, res) => {
  const teachers = await prisma.users.findMany({
    where: { role: { role_name: "Teacher" } },
    include: {
      department: true,
      laptop_rental_as_borrower: {
        orderBy: { rental_id: "desc" },
        take: 1,
        select: { rental_status: true },
      },
    },
    orderBy: { full_name: "asc" },
  });
  res.json({ ok: true, teachers: teachers.map((teacher) => ({ id: teacher.user_id, name: teacher.full_name, email: teacher.email, phone: teacher.phone, departmentId: teacher.department_id, department: teacher.department?.department_name ?? "-", laptopStatus: teacher.laptop_rental_as_borrower[0]?.rental_status ?? "No Rental" })) });
});

app.post("/api/teachers", async (req, res) => {
  const name = normalizeString(req.body.name); const email = normalizeString(req.body.email).toLowerCase(); const phone = normalizeString(req.body.phone); const departmentId = Number(req.body.departmentId);
  if (!name || !email || !phone || !Number.isInteger(departmentId)) return res.status(400).json({ ok: false, message: "Name, email, phone, and department are required." });
  try {
    const teacherRole = await prisma.role.upsert({ where: { role_name: "Teacher" }, update: {}, create: { role_name: "Teacher" } });
    const username = "teacher-" + Date.now() + "-" + Math.floor(Math.random() * 1000);
    const teacher = await prisma.users.create({ data: { full_name: name, username, email, phone, password_hash: "teacher-record", role_id: teacherRole.role_id, department_id: departmentId, status: "Active" } });
    res.status(201).json({ ok: true, teacher });
  } catch {
    res.status(409).json({ ok: false, message: "This teacher email already exists." });
  }
});

app.put("/api/teachers/:id", async (req, res) => {
  const id = Number(req.params.id); const name = normalizeString(req.body.name); const email = normalizeString(req.body.email).toLowerCase(); const phone = normalizeString(req.body.phone); const departmentId = Number(req.body.departmentId);
  if (!Number.isInteger(id) || !name || !email || !phone || !Number.isInteger(departmentId)) return res.status(400).json({ ok: false, message: "Name, email, phone, and department are required." });
  try { const teacher = await prisma.users.update({ where: { user_id: id }, data: { full_name: name, email, phone, department_id: departmentId } }); res.json({ ok: true, teacher }); }
  catch { res.status(409).json({ ok: false, message: "Unable to update teacher. Check the email." }); }
});

app.delete("/api/teachers/:id", async (req, res) => {
  const id = Number(req.params.id); if (!Number.isInteger(id)) return res.status(400).json({ ok: false });
  try { await prisma.users.delete({ where: { user_id: id } }); res.json({ ok: true }); }
  catch { res.status(409).json({ ok: false, message: "A teacher with rental records cannot be deleted." }); }
});

app.get("/api/laptop-rentals/bulk-options", async (_req, res) => {
  try {
    const [students, teachers, activeRentals, availableLaptops, semesters] = await Promise.all([
      prisma.student.findMany({ where: { status: "Active" }, orderBy: { roll_number: "asc" } }),
      prisma.users.findMany({ where: { status: "Active", role: { role_name: "Teacher" } }, include: { department: true }, orderBy: { full_name: "asc" } }),
      prisma.laptop_rental.findMany({ where: { rental_status: { in: ["pending", "approved", "active", "issued"] } }, select: { student_id: true, teacher_user_id: true } }),
      prisma.item_detail.findMany({ where: { status: "Available", item: { category: { rental_allowed: true } }, qr_code: { some: { is_active: true } }, laptop_rental: { none: { rental_status: { in: ["pending", "approved", "active", "issued"] } } } }, include: { item: true, qr_code: { where: { is_active: true }, orderBy: { generated_at: "asc" }, take: 1 } }, orderBy: { detail_code: "asc" } }),
      prisma.semester.findMany({ orderBy: { semester_id: "desc" } }),
    ]);
    const unavailableStudentIds = [...new Set(activeRentals.map((rental) => rental.student_id).filter((id): id is number => id !== null))];
    const unavailableTeacherIds = [...new Set(activeRentals.map((rental) => rental.teacher_user_id).filter((id): id is number => id !== null))];
    res.json({ ok: true, students, teachers: teachers.map((teacher) => ({ user_id: teacher.user_id, full_name: teacher.full_name, email: teacher.email, department: teacher.department?.department_name ?? "-" })), unavailableStudentIds, unavailableTeacherIds, availableLaptops: availableLaptops.map((laptop) => ({ id: laptop.item_detail_id, code: laptop.detail_code, qrCode: laptop.qr_code[0]?.qr_code_id, name: laptop.item.item_name })), semesters });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, message: "Unable to prepare bulk rental data" });
  }
});

app.post("/api/laptop-rentals/bulk-issue", async (req, res) => {
  const borrowerRole = normalizeString(req.body.role).toLowerCase() === "teacher" ? "teacher" : "student";
  const borrowerIds: number[] = Array.isArray(req.body.borrowerIds ?? req.body.studentIds)
    ? [...new Set<number>((req.body.borrowerIds ?? req.body.studentIds).map((value: unknown): number => Number(value)).filter((value: number) => Number.isInteger(value)))]
    : [];
  const dueDate = new Date(req.body.dueDate);
  const requestedSemesterId = Number(req.body.semesterId);
  if (!borrowerIds.length || Number.isNaN(dueDate.getTime())) return res.status(400).json({ ok: false, message: "Select at least one borrower and a valid return date." });
  try {
    const result = await prisma.$transaction(async (tx) => {
      const issuer = await tx.users.findFirst({ where: { status: "Active" }, orderBy: { user_id: "asc" } }) ?? await tx.users.findFirst({ orderBy: { user_id: "asc" } });
      let semester = Number.isInteger(requestedSemesterId) && requestedSemesterId > 0
        ? await tx.semester.findUnique({ where: { semester_id: requestedSemesterId } })
        : await tx.semester.findFirst({ where: { status: "Active" }, orderBy: { semester_id: "desc" } }) ?? await tx.semester.findFirst({ orderBy: { semester_id: "desc" } });
      if (!issuer) throw new Error("Create an active system user before issuing rentals.");
      if (!semester) {
        const year = new Date().getFullYear();
        semester = await tx.semester.create({ data: { academic_year: String(year) + "-" + String(year + 1), semester_name: "Rental", start_date: new Date(year, 0, 1), end_date: new Date(year, 11, 31), status: "Active" } });
      }
      const borrowers = borrowerRole === "student"
        ? await tx.student.findMany({ where: { student_id: { in: borrowerIds }, status: "Active" }, orderBy: { roll_number: "asc" } })
        : await tx.users.findMany({ where: { user_id: { in: borrowerIds }, status: "Active", role: { role_name: "Teacher" } }, orderBy: { full_name: "asc" } });
      if (borrowers.length !== borrowerIds.length) throw new Error("Some selected borrowers are not active or do not exist.");
      const existing = await tx.laptop_rental.findMany({ where: { ...(borrowerRole === "student" ? { student_id: { in: borrowerIds } } : { teacher_user_id: { in: borrowerIds } }), rental_status: { in: ["pending", "approved", "active", "issued"] } }, select: { rental_id: true } });
      if (existing.length) throw new Error("One or more selected borrowers already have an active laptop rental.");
      const laptops = await tx.item_detail.findMany({ where: { status: "Available", item: { category: { rental_allowed: true } }, qr_code: { some: { is_active: true } }, laptop_rental: { none: { rental_status: { in: ["pending", "approved", "active", "issued"] } } } }, orderBy: { detail_code: "asc" }, take: borrowers.length });
      if (laptops.length < borrowers.length) throw new Error("Not enough available rental laptops for the selected borrowers.");
      const issueDate = new Date();
      await tx.laptop_rental.createMany({ data: borrowers.map((borrower: any, index) => ({ student_id: borrowerRole === "student" ? borrower.student_id : null, teacher_user_id: borrowerRole === "teacher" ? borrower.user_id : null, item_detail_id: laptops[index].item_detail_id, semester_id: semester.semester_id, issued_by: issuer.user_id, issue_date: issueDate, due_date: dueDate, rental_status: "pending", condition_out: "Good" })) });
      return { issued: borrowers.length, role: borrowerRole, semester: semester.semester_name };
    });
    res.status(201).json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to issue bulk rentals.";
    res.status(400).json({ ok: false, message });
  }
});

app.post("/api/laptop-rentals/import", async (req, res) => {
  const rows = Array.isArray(req.body.rentals) ? req.body.rentals : [];
  if (!rows.length) return res.status(400).json({ ok: false, message: "No rental rows were provided." });
  try {
    const result = await prisma.$transaction(async (tx) => {
      const issuer = await tx.users.findFirst({ where: { status: "Active" }, orderBy: { user_id: "asc" } });
      let semester = await tx.semester.findFirst({ where: { status: "Active" }, orderBy: { semester_id: "desc" } });
      if (!issuer) throw new Error("No active system user is available to issue rentals.");
      if (!semester) { const year = new Date().getFullYear(); semester = await tx.semester.create({ data: { academic_year: String(year) + "-" + String(year + 1), semester_name: "Rental", start_date: new Date(year, 0, 1), end_date: new Date(year, 11, 31), status: "Active" } }); }
      for (const raw of rows) {
        const role = normalizeString(raw.role).toLowerCase() === "teacher" ? "teacher" : "student";
        const borrowerKey = normalizeString(raw.borrower_id || raw.roll_number || raw.email);
        const qrCode = normalizeString(raw.inventory_qr || raw.qr_code);
        const dueDate = new Date(raw.expected_return_date || raw.due_date);
        const status = normalizeString(raw.status).toLowerCase() || "pending";
        if (!borrowerKey || !qrCode || Number.isNaN(dueDate.getTime()) || !["pending", "approved", "returned", "rejected"].includes(status)) throw new Error("Each import row requires valid role, borrower_id, inventory_qr, expected_return_date, and status.");
        const borrower = role === "student" ? await tx.student.findFirst({ where: { roll_number: borrowerKey, status: "Active" } }) : await tx.users.findFirst({ where: { email: borrowerKey, status: "Active", role: { role_name: "Teacher" } } });
        if (!borrower) throw new Error("Borrower not found: " + borrowerKey);
        const qr = await tx.qr_code.findFirst({ where: { qr_code_id: qrCode, is_active: true }, include: { item_detail: true } });
        if (!qr || !qr.item_detail || !["Available"].includes(qr.item_detail.status)) throw new Error("QR laptop is unavailable: " + qrCode);
        const existingRental = await tx.laptop_rental.findFirst({ where: { item_detail_id: qr.item_detail.item_detail_id, rental_status: { in: ["pending", "approved", "active", "issued"] } }, select: { rental_id: true } });
        if (existingRental) throw new Error("QR laptop already has a pending or active rental: " + qrCode);
        // Pending is only a request/reservation. A laptop becomes physically
        // in use only after it has been approved/issued.
        const active = ["approved", "active", "issued"].includes(status);
        const borrowerRecord: any = borrower;
        await tx.laptop_rental.create({ data: { student_id: role === "student" ? borrowerRecord.student_id : null, teacher_user_id: role === "teacher" ? borrowerRecord.user_id : null, item_detail_id: qr.item_detail_id, semester_id: semester.semester_id, issued_by: issuer.user_id, issue_date: new Date(), due_date: dueDate, return_date: active ? null : new Date(), rental_status: status, condition_out: "Good", condition_in: active ? null : "Good" } });
        if (active) await tx.item_detail.update({ where: { item_detail_id: qr.item_detail_id }, data: { status: "In Use" } });
      }
      return rows.length;
    });
    res.status(201).json({ ok: true, imported: result });
  } catch (error) {
    res.status(400).json({ ok: false, message: error instanceof Error ? error.message : "Unable to import rentals." });
  }
});

app.post("/api/laptop-rentals/:id/return", async (req, res) => {
  const rentalId = Number(req.params.id);
  if (!Number.isInteger(rentalId)) return res.status(400).json({ ok: false, message: "Invalid rental record." });
  try {
    await prisma.$transaction(async (tx) => {
      const rental = await tx.laptop_rental.findUnique({ where: { rental_id: rentalId } });
      if (!rental) throw new Error("Rental record not found.");
      if (["returned", "completed"].includes(rental.rental_status.toLowerCase())) throw new Error("This laptop has already been returned.");
      await tx.laptop_rental.update({ where: { rental_id: rentalId }, data: { rental_status: "returned", return_date: new Date(), condition_in: "Good" } });
      const remainingActiveRentals = await tx.laptop_rental.count({ where: { item_detail_id: rental.item_detail_id, rental_status: { in: ["approved", "active", "issued"] } } });
      await tx.item_detail.update({ where: { item_detail_id: rental.item_detail_id }, data: { status: remainingActiveRentals ? "In Use" : "Available" } });
    });
    res.json({ ok: true, message: "Laptop returned and made available." });
  } catch (error) {
    res.status(400).json({ ok: false, message: error instanceof Error ? error.message : "Unable to return laptop." });
  }
});

app.patch("/api/laptop-rentals/:id/status", async (req, res) => {
  const rentalId = Number(req.params.id);
  const requestedStatus = normalizeString(req.body.status).toLowerCase();
  const statusMap: Record<string, string> = { pending: "pending", approved: "approved", returned: "returned", rejected: "rejected", denied: "rejected", issued: "approved", active: "approved" };
  const rentalStatus = statusMap[requestedStatus];
  if (!Number.isInteger(rentalId) || !rentalStatus) return res.status(400).json({ ok: false, message: "Choose Pending, Approved, Returned, or Rejected." });
  try {
    await prisma.$transaction(async (tx) => {
      const rental = await tx.laptop_rental.findUnique({ where: { rental_id: rentalId } });
      if (!rental) throw new Error("Rental record not found.");
      const releasing = ["returned", "rejected"].includes(rentalStatus);
      const terminalRental = ["returned", "rejected", "completed"].includes(rental.rental_status.toLowerCase());
      const item = await tx.item_detail.findUnique({ where: { item_detail_id: rental.item_detail_id } });
      if (!item) throw new Error("Assigned laptop no longer exists.");
      if (!releasing && terminalRental) {
        const otherActiveRental = await tx.laptop_rental.findFirst({ where: { item_detail_id: rental.item_detail_id, rental_id: { not: rentalId }, rental_status: { in: ["pending", "approved", "active", "issued"] } }, select: { rental_id: true } });
        if (otherActiveRental) throw new Error("This laptop already has an active rental and cannot be assigned again.");
      }
      await tx.laptop_rental.update({ where: { rental_id: rentalId }, data: { rental_status: rentalStatus, return_date: releasing ? new Date() : null, condition_in: releasing ? "Good" : null } });
      const remainingActiveRentals = await tx.laptop_rental.count({ where: { item_detail_id: rental.item_detail_id, rental_status: { in: ["approved", "active", "issued"] } } });
      await tx.item_detail.update({ where: { item_detail_id: rental.item_detail_id }, data: { status: remainingActiveRentals ? "In Use" : "Available" } });
    });
    res.json({ ok: true, message: "Rental status updated." });
  } catch (error) {
    res.status(400).json({ ok: false, message: error instanceof Error ? error.message : "Unable to update rental status." });
  }
});

app.get("/api/laptop-rentals/filter-options", async (_req, res) => {
  try {
    const [departments, academicYears] = await Promise.all([
      prisma.department.findMany({ select: { department_id: true, department_name: true }, orderBy: { department_name: "asc" } }),
      prisma.budget_year.findMany({ select: { budget_year_id: true, year_name: true }, orderBy: { start_date: "desc" } }),
    ]);
    res.json({ ok: true, departments: departments.map((department) => ({ id: department.department_id, name: department.department_name })), academicYears: academicYears.map((year) => ({ id: year.budget_year_id, name: year.year_name })) });
  } catch (error) {
    res.status(500).json({ ok: false, message: "Unable to load rental filter options." });
  }
});

app.get("/api/laptop-rentals", async (req, res) => {
  try {
    const statusFilter = normalizeString(req.query.status).toLowerCase();
    const roleFilter = normalizeString(req.query.role).toLowerCase();
    const departmentFilter = normalizeString(req.query.department).toLowerCase();
    const academicYearFilter = normalizeString(req.query.academicYear).toLowerCase();

    // Repair records created before pending rentals were separated from
    // physically issued laptops. Pending-only laptops must remain available;
    // a laptop is in use only when it has an approved/active/issued rental.
    await prisma.item_detail.updateMany({
      where: {
        status: "In Use",
        laptop_rental: {
          some: { rental_status: "pending" },
          none: { rental_status: { in: ["approved", "active", "issued"] } },
        },
      },
      data: { status: "Available" },
    });
    const rentalLaptopWhere = {
      item: { category: { rental_allowed: true } },
      qr_code: { some: { is_active: true } },
    };
    const [rentals, availableQuantity, inUseQuantity, totalQuantity] = await Promise.all([
      prisma.laptop_rental.findMany({
        include: {
          student: true,
          teacher: { include: { department: true } },
          semester: true,
          item_detail: { include: { item: true, department: true, room: true, qr_code: { where: { is_active: true }, orderBy: { generated_at: "asc" }, take: 1 } } },
        },
        // Rental IDs shown to users are a continuous, chronological sequence.
        // The database primary key can contain gaps after deletions/imports.
        orderBy: { rental_id: "asc" },
      }),
      prisma.item_detail.count({ where: { ...rentalLaptopWhere, status: "Available" } }),
      prisma.item_detail.count({ where: { ...rentalLaptopWhere, status: "In Use" } }),
      prisma.item_detail.count({ where: rentalLaptopWhere }),
    ]);
    const rows = rentals.map((rental: any, index: number) => ({
      id: rental.rental_id,
      rentalCode: `RNT-${String(index + 1).padStart(3, "0")}`,
      studentName: rental.student?.student_name ?? rental.teacher?.full_name ?? "-",
      rollNumber: rental.student?.roll_number ?? rental.teacher?.email ?? "-",
      department: rental.student?.major ?? rental.teacher?.department?.department_name ?? "-",
      year: rental.semester.semester_name,
      laptopName: rental.item_detail.item.item_name,
      laptopId: rental.item_detail.detail_code,
      qrCode: rental.item_detail.qr_code[0]?.qr_code_id ?? "-",
      inventoryStatus: rental.item_detail.status,
      inventoryDepartment: rental.item_detail.department?.department_name ?? "Store",
      inventoryRoom: rental.item_detail.room?.building_name ?? "",
      inventoryRegisteredDate: rental.item_detail.purchase_date?.toISOString() ?? rental.item_detail.created_at.toISOString(),
      inventoryRemark: rental.item_detail.notes ?? "",
      issueDate: rental.issue_date,
      returnDate: rental.due_date,
      status: rental.rental_status,
      role: rental.student ? "Student" : "Teacher",
      academicYear: rental.semester.academic_year,
    }));
    const filteredRows = rows.filter((row: any) => {
      const normalizedStatus = String(row.status).toLowerCase();
      const matchesStatus = !statusFilter || (statusFilter === "approved" ? ["approved", "issued", "active"].includes(normalizedStatus) : statusFilter === "returned" ? ["returned", "completed"].includes(normalizedStatus) : normalizedStatus === statusFilter);
      const matchesRole = !roleFilter || String(row.role).toLowerCase() === roleFilter;
      const matchesDepartment = !departmentFilter || String(row.department).toLowerCase() === departmentFilter;
      const matchesAcademicYear = !academicYearFilter || String(row.academicYear).toLowerCase() === academicYearFilter || String(row.academicYear).toLowerCase().startsWith(academicYearFilter + "-");
      return matchesStatus && matchesRole && matchesDepartment && matchesAcademicYear;
    });
    const count = (statuses: string[]) => rows.filter((row: any) => statuses.includes(String(row.status).toLowerCase())).length;
    // Use the inventory status for both figures. Rental history can include
    // completed/rejected records, while item_detail is the source of truth for
    // whether a physical laptop is currently available or in use.
    res.json({ ok: true, summary: { all: totalQuantity, pending: count(["pending"]), active: inUseQuantity, returned: count(["returned", "completed"]), available: availableQuantity }, rentals: filteredRows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, message: "Unable to load laptop rentals" });
  }
});

function normalizeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

async function findOrCreateRoom(departmentId: number, buildingName: string) {
  const existingRoom = await prisma.room.findFirst({
    where: {
      department_id: departmentId,
      building_name: buildingName,
    },
  });

  if (existingRoom) {
    return existingRoom;
  }

  return prisma.room.create({
    data: {
      department_id: departmentId,
      building_name: buildingName,
      status: true,
    },
  });
}

async function createQrCodeForItemDetailId(itemDetailId: number) {
  const qrCodeId = String(itemDetailId);

  const existingQrCode = await prisma.qr_code.findUnique({
    where: { qr_code_id: qrCodeId },
  });

  if (existingQrCode) {
    return 0;
  }

  const itemDetail = await prisma.item_detail.findUnique({
    where: { item_detail_id: itemDetailId },
    select: { item_detail_id: true },
  });

  if (!itemDetail) {
    return 0;
  }

  await prisma.qr_code.create({
    data: {
      qr_code_id: qrCodeId,
      item_detail_id: itemDetail.item_detail_id,
    },
  });

  return 1;
}

async function createQrCodesForDetailCodes(detailCodes: string[]) {
  if (detailCodes.length === 0) {
    return 0;
  }

  const existingQrCodes = await prisma.qr_code.findMany({
    where: {
      qr_code_id: { in: detailCodes },
    },
    select: {
      qr_code_id: true,
    },
  });

  const existingQrCodeIds = new Set(
    existingQrCodes.map((code) => code.qr_code_id),
  );
  const missingDetailCodes = detailCodes.filter(
    (detailCode) => !existingQrCodeIds.has(detailCode),
  );

  if (missingDetailCodes.length === 0) {
    return 0;
  }

  const itemDetails = await prisma.item_detail.findMany({
    where: {
      detail_code: { in: missingDetailCodes },
    },
    select: {
      item_detail_id: true,
      detail_code: true,
    },
  });

  const qrCodeData = itemDetails.map((detail) => ({
    qr_code_id: detail.detail_code,
    item_detail_id: detail.item_detail_id,
  }));

  if (qrCodeData.length === 0) {
    return 0;
  }

  await prisma.qr_code.createMany({
    data: qrCodeData,
    skipDuplicates: true,
  });

  return qrCodeData.length;
}

function buildTransferCode() {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");

  return `TRF-${datePart}-${Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0")}`;
}

app.post("/api/transfers", async (req, res) => {
  try {
    const fromDepartmentName = normalizeString(req.body.fromDepartment);
    const fromRoomName = normalizeString(req.body.fromRoom);
    const toDepartmentName = normalizeString(req.body.toDepartment);
    const toRoomName = normalizeString(req.body.toRoom);
    const transferDate = normalizeString(req.body.transferDate);
    const remarks = normalizeString(req.body.remarks) || null;
    const itemDetailIds = Array.isArray(req.body.itemDetailIds)
      ? (req.body.itemDetailIds as unknown[])
          .map((value: unknown) => normalizeString(value))
          .filter(Boolean)
      : [];

    if (
      !fromDepartmentName ||
      !toDepartmentName ||
      !toRoomName ||
      itemDetailIds.length === 0 ||
      !transferDate
    ) {
      res.status(400).json({
        ok: false,
        message:
          "fromDepartment, toDepartment, toRoom, transferDate and itemDetailIds are required",
      });
      return;
    }

    const isDepartmentHead = req.auth?.role.code === "DEPARTMENT_HEAD";
    const fromDepartment = isDepartmentHead
      ? await prisma.department.findFirst({ where: { department_name: fromDepartmentName } })
      : await findOrCreateDepartment(fromDepartmentName);
    const toDepartment = isDepartmentHead
      ? await prisma.department.findFirst({ where: { department_name: toDepartmentName } })
      : await findOrCreateDepartment(toDepartmentName);
    if (!fromDepartment || !toDepartment) {
      res.status(404).json({ ok: false, message: "Department not found" });
      return;
    }
    if (!requireDepartmentScope(fromDepartment.department_id, res, req.auth)) return;

    const fromRoom = fromRoomName
      ? (isDepartmentHead
          ? await prisma.room.findFirst({ where: { department_id: fromDepartment.department_id, building_name: fromRoomName } })
          : await findOrCreateRoom(fromDepartment.department_id, fromRoomName))
      : null;

    const toRoom = toRoomName
      ? (isDepartmentHead
          ? await prisma.room.findFirst({ where: { department_id: toDepartment.department_id, building_name: toRoomName } })
          : await findOrCreateRoom(toDepartment.department_id, toRoomName))
      : null;
    if (isDepartmentHead && (fromRoomName && !fromRoom || !toRoom)) {
      res.status(404).json({ ok: false, message: "Room not found" });
      return;
    }

    const itemDetails = await prisma.item_detail.findMany({
      where: {
        detail_code: { in: itemDetailIds },
      },
    });

    if (itemDetails.length !== itemDetailIds.length) {
      res.status(404).json({
        ok: false,
        message: "Some item detail IDs were not found",
      });
      return;
    }

    if (
      itemDetails.some(
        (detail) => detail.status !== "Available" && detail.status !== "Damaged",
      )
    ) {
      res.status(400).json({
        ok: false,
        message: "Only assets with Available or Damaged status can be transferred",
      });
      return;
    }

    const invalidLocation = itemDetails.some((detail) => {
      if (detail.current_department_id !== fromDepartment.department_id) {
        return true;
      }

      if (fromRoom && detail.current_room_id !== fromRoom.room_id) {
        return true;
      }

      return false;
    });

    if (invalidLocation) {
      res.status(400).json({
        ok: false,
        message:
          "All selected items must be located in the chosen fromDepartment and fromRoom",
      });
      return;
    }

    const initiatedBy = req.auth ? await prisma.users.findUnique({ where: { user_id: req.auth.id } }) : null;

    if (!initiatedBy) {
      res.status(500).json({
        ok: false,
        message: "No user exists to record transfer initiation",
      });
      return;
    }

    const parsedTransferDate = new Date(transferDate);

    if (Number.isNaN(parsedTransferDate.getTime())) {
      res.status(400).json({
        ok: false,
        message: "Invalid transferDate",
      });
      return;
    }

    const transfer = await prisma.$transaction(async (tx) => {
      const createdTransfer = await tx.transfer.create({
        data: {
          transfer_code: buildTransferCode(),
          from_department_id: fromDepartment.department_id,
          from_room_id: fromRoom?.room_id ?? null,
          to_department_id: toDepartment.department_id,
          to_room_id: toRoom?.room_id ?? null,
          initiated_by: initiatedBy.user_id,
          transfer_date: parsedTransferDate,
          transfer_status: "Completed",
          remarks,
          transfer_item: {
            create: itemDetails.map((detail) => ({
              item_detail_id: detail.item_detail_id,
              condition_before: detail.status,
              item_status: detail.status,
            })),
          },
        },
      });

      await tx.item_detail.updateMany({
        where: {
          detail_code: { in: itemDetailIds },
        },
        data: {
          current_department_id: toDepartment.department_id,
          current_room_id: toRoom?.room_id ?? null,
        },
      });

      return createdTransfer;
    });

    res.status(201).json({
      ok: true,
      transfer_id: transfer.transfer_id,
      transfer_code: transfer.transfer_code,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      ok: false,
      message: "Failed to create transfer",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

app.delete("/api/items/:id", async (req, res) => {
  try {
    const itemId =
      typeof req.params.id === "string" ? req.params.id.trim() : "";

    if (!itemId) {
      res.status(400).json({
        ok: false,
        message: "item id is required",
      });
      return;
    }

    const existingItem = await prisma.item.findUnique({
      where: { item_id: itemId },
      include: { item_detail: true },
    });

    if (!existingItem) {
      res.status(404).json({
        ok: false,
        message: "Item not found",
      });
      return;
    }

    await prisma.item_detail.deleteMany({
      where: { item_id: itemId },
    });

    await prisma.item.delete({
      where: { item_id: itemId },
    });

    await recordActivity("deleted", "Inventory", {
      type: "Item",
      id: existingItem.item_id,
      name: existingItem.item_name,
    }, { removed_units: existingItem.item_detail.length });

    res.json({
      ok: true,
      message: "Item deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      ok: false,
      message: "Failed to delete inventory item",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

app.put("/api/items/:id/image", async (req, res) => {
  try {
    const itemId = normalizeString(req.params.id);
    const imageData =
      typeof req.body.image_data === "string" ? req.body.image_data : "";

    if (!itemId || !imageData) {
      res.status(400).json({
        ok: false,
        message: "item id and image_data are required",
      });
      return;
    }

    const existingItem = await prisma.item.findUnique({
      where: { item_id: itemId },
      select: { item_id: true, item_name: true },
    });

    if (!existingItem) {
      res.status(404).json({ ok: false, message: "Item not found" });
      return;
    }

    const imageUrl = await saveItemImage(itemId, imageData);
    const item = await prisma.item.update({
      where: { item_id: itemId },
      data: { image_url: imageUrl },
      include: {
        category: true,
        _count: { select: { item_detail: true } },
      },
    });

    await recordActivity("updated", "Inventory", {
      type: "Item image",
      id: item.item_id,
      name: existingItem.item_name,
    }, { image: "updated" });

    res.json({
      ok: true,
      item: {
        item_id: item.item_id,
        item_name: item.item_name,
        category_name: item.category.category_name,
        image_url: item.image_url,
        quantity: item._count.item_detail,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({
      ok: false,
      message: error instanceof Error ? error.message : "Failed to save image",
    });
  }
});

app.put("/api/items/:id/category", async (req, res) => {
  try {
    const itemId = normalizeString(req.params.id);
    const categoryId = Number(req.body.category_id);

    if (!itemId || !Number.isInteger(categoryId) || categoryId <= 0) {
      res.status(400).json({ ok: false, message: "Valid item and category IDs are required" });
      return;
    }

    const category = await prisma.category.findUnique({ where: { category_id: categoryId } });
    if (!category) {
      res.status(404).json({ ok: false, message: "Category not found" });
      return;
    }

    const existingItem = await prisma.item.findUnique({
      where: { item_id: itemId },
      include: { category: true },
    });
    if (!existingItem) {
      res.status(404).json({ ok: false, message: "Item not found" });
      return;
    }

    const item = await prisma.item.update({
      where: { item_id: itemId },
      data: { category_id: category.category_id },
      include: { _count: { select: { item_detail: true } } },
    });

    await recordActivity("updated", "Inventory", {
      type: "Item category",
      id: item.item_id,
      name: item.item_name,
    }, { category: { from: existingItem.category.category_name, to: category.category_name } });

    res.json({
      ok: true,
      item: {
        item_id: item.item_id,
        item_name: item.item_name,
        category_name: category.category_name,
        image_url: item.image_url,
        quantity: item._count.item_detail,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, message: "Failed to update item category" });
  }
});

app.post("/api/items", async (req, res) => {
  try {
    const itemName =
      typeof req.body.item_name === "string" ? req.body.item_name.trim() : "";
    const categoryName =
      typeof req.body.category_name === "string"
        ? req.body.category_name.trim()
        : "";
    const categoryId = Number(req.body.category_id);
    const quantity = Number(req.body.quantity) || 1;
    const imageData =
      typeof req.body.image_data === "string" ? req.body.image_data : "";
    const remark =
      typeof req.body.remark === "string" ? req.body.remark.trim() : "";
    const departmentId = Number(req.body.department_id);
    const roomId = Number(req.body.room_id);

    if (
      !itemName ||
      !categoryName ||
      quantity < 1 ||
      !Number.isInteger(departmentId) ||
      departmentId <= 0 ||
      !Number.isInteger(roomId) ||
      roomId <= 0 ||
      remark.length > 255
    ) {
      res.status(400).json({
        ok: false,
        message:
          "item_name, category_name, quantity, department_id and room_id are required; remark must not exceed 255 characters",
      });
      return;
    }

    const category = Number.isInteger(categoryId) && categoryId > 0
      ? await prisma.category.findUnique({ where: { category_id: categoryId } })
      : await prisma.category.findFirst({ where: { category_name: categoryName } });

    if (!category) {
      res.status(404).json({
        ok: false,
        message: "Category not found",
      });
      return;
    }

    const budgetYear = await getDefaultBudgetYear();
    const room = await prisma.room.findFirst({
      where: {
        room_id: roomId,
        department_id: departmentId,
      },
    });

    if (!room) {
      res.status(400).json({
        ok: false,
        message: "Selected room does not belong to the selected department",
      });
      return;
    }

    const existingItem = await prisma.item.findFirst({
      where: {
        item_name: itemName,
        category_id: category.category_id,
      },
      include: {
        _count: {
          select: {
            item_detail: true,
          },
        },
      },
    });

    let item = existingItem;

    if (!item) {
      const itemId = await generateNextItemId();
      item = await prisma.item.create({
        data: {
          item_id: itemId,
          item_code: itemId,
          item_name: itemName,
          category_id: category.category_id,
          image_url: null,
        },
        include: {
          _count: {
            select: {
              item_detail: true,
            },
          },
        },
      });
    }

    if (!item) {
      throw new Error("Failed to create inventory item");
    }

    const createdOrExistingItem = item;

    if (!validateItemId(createdOrExistingItem.item_id)) {
      throw new Error(
        `Invalid item_id '${createdOrExistingItem.item_id}' in existing item record: expected 4 characters.`,
      );
    }

    const startingSerial = existingItem
      ? existingItem._count.item_detail + 1
      : 1;

    const detailRows = Array.from({ length: quantity }, (_, index) => {
      const serialNumber = startingSerial + index;
      const serialText = String(serialNumber).padStart(6, "0");

      if (serialText.length !== 6) {
        throw new Error(
          `Generated serial text '${serialText}' is invalid; expected 6 digits.`,
        );
      }

      const detailCode = `${createdOrExistingItem.item_id}-${serialText}`;

      if (detailCode.length !== 11) {
        throw new Error(
          `Generated detail_code '${detailCode}' is invalid; expected 11 characters.`,
        );
      }

      return {
        item_id: createdOrExistingItem.item_id,
        detail_code: detailCode,
        budget_year_id: budgetYear.budget_year_id,
        status: "Available",
        notes: remark || null,
        current_department_id: departmentId,
        current_room_id: room.room_id,
      };
    });

    const invalidRow = detailRows.find(
      (row) => row.item_id.length !== 4 || row.detail_code.length !== 11,
    );

    if (invalidRow) {
      throw new Error(
        `Invalid item_detail row: item_id='${invalidRow.item_id}' (${invalidRow.item_id.length} chars), detail_code='${invalidRow.detail_code}' (${invalidRow.detail_code.length} chars)`,
      );
    }

    await prisma.item_detail.createMany({
      data: detailRows,
    });

    const createdDetailCodes = detailRows.map((row) => row.detail_code);
    await createQrCodesForDetailCodes(createdDetailCodes);

    if (imageData) {
      const imageUrl = await saveItemImage(item.item_id, imageData);
      item = await prisma.item.update({
        where: { item_id: item.item_id },
        data: { image_url: imageUrl },
        include: {
          _count: {
            select: {
              item_detail: true,
            },
          },
        },
      });
    }

    const totalQuantity = startingSerial + quantity - 1;

    await recordActivity(existingItem ? "updated" : "created", "Inventory", {
      type: "Item",
      id: item.item_id,
      name: item.item_name,
    }, {
      ...(existingItem ? { added_units: quantity, quantity_before: existingItem._count.item_detail, quantity_after: totalQuantity } : { added_units: quantity }),
      category: category.category_name,
      room: room.building_name ?? "Unassigned room",
      notes: remark || null,
    });

    res.status(existingItem ? 200 : 201).json({
      ok: true,
      item: {
        item_id: item.item_id,
        item_name: item.item_name,
        category_name: category.category_name,
        image_url: item.image_url,
        quantity: totalQuantity,
        added_quantity: quantity,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      ok: false,
      message: error instanceof Error ? error.message : "Failed to create item",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

app.put("/api/departments/:id", async (req, res) => {
  try {
    const roomId = Number(req.params.id);
    const departmentName =
      typeof req.body.department === "string" ? req.body.department.trim() : "";
    const classroom =
      typeof req.body.classroom === "string" ? req.body.classroom.trim() : "";
    const status = req.body.status === "Closed" ? false : true;

    if (!Number.isInteger(roomId) || roomId <= 0) {
      res.status(400).json({
        ok: false,
        message: "Invalid department id",
      });
      return;
    }

    if (!departmentName || !classroom) {
      res.status(400).json({
        ok: false,
        message: "department and classroom are required",
      });
      return;
    }

    const previousRoom = await prisma.room.findUnique({
      where: { room_id: roomId },
      include: { department: true },
    });
    if (!previousRoom) {
      res.status(404).json({ ok: false, message: "Department room not found" });
      return;
    }

    const conflictingRoom = await prisma.room.findFirst({
      where: {
        building_name: classroom,
        room_id: { not: roomId },
      },
      select: { room_id: true },
    });

    if (conflictingRoom) {
      res.status(409).json({
        ok: false,
        message: "This room is already assigned to another department.",
      });
      return;
    }

    const department = await findOrCreateDepartment(departmentName);

    const room = await prisma.room.update({
      where: { room_id: roomId },
      data: {
        department_id: department.department_id,
        building_name: classroom,
        status,
      },
      include: {
        department: true,
      },
    });

    await recordActivity("updated", "Department", {
      type: "Department room",
      id: room.room_id,
      name: `${room.department.department_name} — ${room.building_name ?? "Unassigned room"}`,
    }, {
      department: { from: previousRoom.department.department_name, to: room.department.department_name },
      classroom: { from: previousRoom.building_name ?? "", to: room.building_name ?? "" },
      status: { from: previousRoom.status ? "Available" : "Closed", to: room.status ? "Available" : "Closed" },
    });

    res.json({
      ok: true,
      department: {
        id: room.room_id,
        department: room.department.department_name,
        classroom: room.building_name ?? "",
        status: room.status ? "Available" : "Closed",
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      ok: false,
      message: "Failed to update department",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

app.delete("/api/departments/:id", async (req, res) => {
  try {
    const roomId = Number(req.params.id);

    if (!Number.isInteger(roomId) || roomId <= 0) {
      res.status(400).json({
        ok: false,
        message: "Invalid department id",
      });
      return;
    }

    const room = await prisma.room.findUnique({
      where: { room_id: roomId },
      include: { department: true },
    });
    if (!room) {
      res.status(404).json({ ok: false, message: "Department room not found" });
      return;
    }

    await prisma.room.delete({
      where: { room_id: roomId },
    });

    await recordActivity("deleted", "Department", {
      type: "Department room",
      id: room.room_id,
      name: `${room.department.department_name} — ${room.building_name ?? "Unassigned room"}`,
    }, { status: room.status ? "Available" : "Closed" });

    res.json({ ok: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      ok: false,
      message: "Failed to delete department",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

export default app;
