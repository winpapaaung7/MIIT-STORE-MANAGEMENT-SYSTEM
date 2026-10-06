import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../generated/prisma/client.js";
const p = new PrismaClient({ adapter: new PrismaMariaDb(process.env.DATABASE_URL!) });
try {
  const transfers = await p.transfer.findMany({ where: { remarks: "System allocation requested by administrator: room needs balanced; surplus retained in Store." }, select: { transfer_id: true, transfer_status: true, _count: { select: { transfer_item: true } } } });
  const logs = await p.activity_log.count({ where: { module: "Transfer", action: "transferred", target_id: { in: transfers.map((t) => String(t.transfer_id)) } } });
  if (transfers.length !== 35 || logs !== 35 || transfers.some((t) => t.transfer_status !== "Completed")) throw new Error("Transfer/history verification failed");
  const moved = transfers.reduce((n, t) => n + t._count.transfer_item, 0);
  if (moved !== 297) throw new Error("Transferred unit count mismatch");
  console.log(JSON.stringify({ completedTransfers: transfers.length, historyEntries: logs, movedUnits: moved }));
} finally { await p.$disconnect(); }
