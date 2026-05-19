import { htmlToText } from "./html-to-text";
import { isEmpty, asString } from "./normalize";
import { toLabel } from "@/lib/mappers";
import { NormalizedTaskSchema, type SourceTask, type NormalizedTask } from "@/lib/schemas";

// Fields that map to top-level NormalizedTask properties (Notion properties)
const NOTION_PROPERTY_FIELDS = new Set([
  "name", "title", "task_type", "priority", "status",
  "due_date", "label", "creation",
]);

// Fields that become their own body sections
const BODY_SECTION_FIELDS = new Set([
  "description", "addition_description",
]);

// Internal/metadata fields to discard entirely
const IGNORED_FIELDS = new Set([
  "assigned_to", "owner", "modified", "modified_by",
  "docstatus", "idx", "naming_series", "doctype", "__last_sync_on",
]);

export function transformTask(source: SourceTask): NormalizedTask {
  const details: Record<string, string> = {};

  for (const [key, value] of Object.entries(source)) {
    if (NOTION_PROPERTY_FIELDS.has(key)) continue;
    if (BODY_SECTION_FIELDS.has(key)) continue;
    if (IGNORED_FIELDS.has(key)) continue;
    if (isEmpty(value)) continue;
    details[toLabel(key)] = String(value).trim();
  }

  const rawDesc = source["description"];
  const rawAddDesc = source["addition_description"];

  const normalized: NormalizedTask = {
    id: asString(source["name"]) ?? "",
    title: asString(source["title"]) ?? "Untitled",
    taskType: asString(source["task_type"]) ?? undefined,
    priority: asString(source["priority"]) ?? undefined,
    status: asString(source["status"]) ?? undefined,
    dueDate: asString(source["due_date"]),
    creationDate: asString(source["creation"]) ?? undefined,
    project: asString(source["label"]),
    description:
      !isEmpty(rawDesc) ? htmlToText(String(rawDesc)) : null,
    additionDescription:
      !isEmpty(rawAddDesc) ? String(rawAddDesc).trim() : null,
    details,
  };

  return NormalizedTaskSchema.parse(normalized);
}
