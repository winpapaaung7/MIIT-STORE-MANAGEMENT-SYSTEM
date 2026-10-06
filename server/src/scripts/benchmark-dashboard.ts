import "dotenv/config";
import express from "express";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../generated/prisma/client.js";
import { createDashboardRouter } from "../routes/dashboard.js";
const prisma = new PrismaClient({ adapter: new PrismaMariaDb(process.env.DATABASE_URL!) });
const app = express(); app.use(createDashboardRouter(prisma));
const server = app.listen(0, "127.0.0.1");
try {
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("No local port");
  for (const query of ["", "?departmentId=2&activeDepartmentId=2"]) {
    const start = performance.now();
    const response = await fetch(`http://127.0.0.1:${address.port}/overview${query}`);
    const body = await response.text();
    const data = JSON.parse(body);
    console.log(JSON.stringify({ query: query || "all", milliseconds: Math.round(performance.now() - start), bytes: Buffer.byteLength(body), status: response.status, total: data.summary?.totalItems }));
  }
} finally { server.close(); await prisma.$disconnect(); }
