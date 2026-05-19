import Papa from "papaparse";
import { CSV_TO_JSON_KEY } from "@/lib/mappers";
import type { SourceTask } from "@/lib/schemas";

export function parseCSV(raw: string): SourceTask[] {
  const result = Papa.parse<Record<string, string>>(raw, {
    header: true,
    skipEmptyLines: true,
  });

  if (result.errors.length > 0 && result.data.length === 0) {
    throw new Error(`CSV parse error: ${result.errors[0]?.message ?? "Unknown error"}`);
  }

  return result.data.map((row) => {
    const task: Record<string, unknown> = {};
    for (const [header, value] of Object.entries(row)) {
      const key =
        CSV_TO_JSON_KEY[header] ??
        header.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
      task[key] = value;
    }
    return task as SourceTask;
  });
}
