export function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim().length === 0;
  if (typeof value === "number") return value === 0;
  return false;
}

export function asString(value: unknown): string | null {
  if (isEmpty(value)) return null;
  return String(value).trim();
}
