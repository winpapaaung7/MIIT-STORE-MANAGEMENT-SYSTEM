export function latestDetailSerial(itemId: string, latestCode?: string | null): number {
  if (!latestCode) return 0;
  if (!/^\d{4}$/.test(itemId) || !latestCode.startsWith(`${itemId}-`) || !/^\d{4}-\d{6}$/.test(latestCode)) {
    throw new Error("Existing inventory detail code has an invalid format");
  }
  return Number(latestCode.slice(5));
}

export function detailCodeForSerial(itemId: string, serial: number): string {
  if (!/^\d{4}$/.test(itemId) || !Number.isSafeInteger(serial) || serial < 1 || serial > 999999) {
    throw new Error("Cannot allocate inventory detail code: serial must be between 1 and 999999");
  }
  return `${itemId}-${String(serial).padStart(6, "0")}`;
}
