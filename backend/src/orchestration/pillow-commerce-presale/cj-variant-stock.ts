/** CJ's queryByVid separates warehouse-managed stock from factory stock.
 * Only a matched VID and direct CJ-managed units can back an approval claim.
 * https://developers.cjdropshipping.com/en/api/api2/api/product.html#3-inventory
 */
export function cjManagedStockByVid(payload: unknown, vid: string): number {
  if (!vid || !Array.isArray(payload) || payload.length === 0 || payload.length > 32) return 0;
  let units = 0;
  const warehouses = new Set<string>();
  for (const entry of payload) {
    if (!entry || typeof entry !== "object") return 0;
    const row = entry as Record<string, unknown>;
    if (row.vid !== vid || typeof row.countryCode !== "string" ||
        !/^[A-Z]{2}$/.test(row.countryCode)) return 0;
    const key = `${row.countryCode}:${String(row.areaId ?? "")}`;
    if (warehouses.has(key)) return 0;
    warehouses.add(key);
    const quantity = row.cjInventoryNum;
    if (!Number.isSafeInteger(quantity) || (quantity as number) < 0) return 0;
    units += quantity as number;
    if (!Number.isSafeInteger(units)) return 0;
  }
  return units;
}
