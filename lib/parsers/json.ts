import type { SourceTask } from "@/lib/schemas";

export function parseJSON(raw: string): SourceTask[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Invalid JSON");
  }

  if (Array.isArray(parsed)) {
    return parsed.filter(
      (item): item is SourceTask =>
        typeof item === "object" && item !== null
    );
  }
  if (typeof parsed === "object" && parsed !== null) {
    return [parsed as SourceTask];
  }
  throw new Error("JSON must be an object or array of objects");
}
