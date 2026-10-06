type ActivityRow = {
  action: string; module: string; target_type: string; target_id: string | null;
  target_name: string; actor_name: string; details: string | null; created_at: Date;
};

export function parseActivityLogs(data: { activityLogs?: unknown }): ActivityRow[] {
  if (data.activityLogs === undefined) return [];
  if (!Array.isArray(data.activityLogs)) throw new Error("activityLogs must be an array");
  return data.activityLogs.map((row: any) => {
    const result: any = {};
    for (const [key, limit] of Object.entries({ action: 20, module: 50, target_type: 50, target_name: 255, actor_name: 100 })) {
      if (typeof row?.[key] !== "string" || row[key].length > limit) throw new Error(`Invalid activity log ${key}`);
      result[key] = row[key];
    }
    if (row.target_id != null && (typeof row.target_id !== "string" || row.target_id.length > 100)) throw new Error("Invalid activity log target_id");
    if (row.details != null && typeof row.details !== "string") throw new Error("Invalid activity log details");
    result.target_id = row.target_id ?? null;
    result.details = row.details ?? null;
    if (typeof row.created_at !== "string") throw new Error("Missing activity log timestamp");
    result.created_at = new Date(row.created_at);
    if (!Number.isFinite(result.created_at.getTime())) throw new Error("Invalid activity log timestamp");
    return result as ActivityRow;
  });
}

export function activityKey(row: ActivityRow): string {
  return JSON.stringify([row.action, row.module, row.target_type, row.target_id, row.target_name, row.actor_name, row.details, Math.floor(row.created_at.getTime() / 1000)]);
}

export async function importActivityLogs(tx: any, rows: ActivityRow[]): Promise<number> {
  const existing: ActivityRow[] = await tx.activity_log.findMany();
  const keys = new Set(existing.map(activityKey));
  const additions = rows.filter((row) => {
    const key = activityKey(row);
    if (keys.has(key)) return false;
    keys.add(key);
    return true;
  });
  // Allocate destination IDs so an unrelated existing audit entry is never overwritten.
  if (additions.length) await tx.activity_log.createMany({ data: additions });
  return additions.length;
}
