import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../generated/prisma/client.js";
const p = new PrismaClient({ adapter: new PrismaMariaDb(process.env.DATABASE_URL!) });
try {
  const latest = await p.item_detail.findMany({ where: { item_id: "0006" }, select: { item_id: true, detail_code: true }, orderBy: { detail_code: "desc" }, take: 8 });
  const mismatches = await p.$queryRawUnsafe("SELECT item_id,detail_code FROM item_detail WHERE LEFT(detail_code,4) <> item_id LIMIT 20");
  console.log(JSON.stringify({ latest, mismatches }));
  const clock = await p.$queryRawUnsafe("SELECT CAST(NOW() AS CHAR) AS db_now, CAST(UTC_TIMESTAMP() AS CHAR) AS utc_now, @@session.time_zone AS session_zone, @@global.time_zone AS global_zone");
  const activities = await p.$queryRawUnsafe("SELECT activity_log_id, target_name, CAST(created_at AS CHAR) AS stored_time FROM activity_log ORDER BY activity_log_id DESC LIMIT 5");
  console.log(JSON.stringify({ node_utc: new Date().toISOString(), clock, activities }));
} finally { await p.$disconnect(); }
