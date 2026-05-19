import { Client, isFullPage, isFullPageOrDataSource } from "@notionhq/client";
import type { BlockObjectRequest } from "@notionhq/client/build/src/api-endpoints/common";
import type { CreatePayload, NormalizedTask } from "@/lib/schemas";
import { NOTION_STATUS_MAP, NOTION_STATUS_FALLBACK } from "@/lib/mappers";
import type { Result } from "@/lib/result";

type NotionSuccess = { pageId: string; url: string; created: boolean };

function makeClient() {
  return new Client({
    auth: process.env.NOTION_TOKEN,
    notionVersion: "2026-03-11",
    retry: { maxRetries: 3 },
  });
}

// Extract YYYY-MM-DD from "2026-02-21 08:38:47..." or ISO strings
function toNotionDate(dateStr: string): string {
  const m = dateStr.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : dateStr;
}

function richText(content: string) {
  return [{ type: "text" as const, text: { content: content.slice(0, 2000) } }];
}

function h2(text: string): BlockObjectRequest {
  return { heading_2: { rich_text: richText(text) } };
}

function divider(): BlockObjectRequest {
  return { divider: {} };
}

// Splits text at paragraph boundaries, yielding paragraph blocks (each ≤2000 chars)
function textToBlocks(text: string): BlockObjectRequest[] {
  const paras = text.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
  return paras.flatMap((para): BlockObjectRequest[] => {
    const chunks: string[] = [];
    for (let i = 0; i < para.length; i += 2000) chunks.push(para.slice(i, i + 2000));
    return chunks.map((chunk) => ({ paragraph: { rich_text: richText(chunk) } }));
  });
}

function buildProperties(task: NormalizedTask, payload: CreatePayload) {
  const props: Record<string, unknown> = {
    Title: { title: richText(payload.confirmedTitle) },
    ID: { rich_text: richText(task.id) },
  };

  if (task.taskType) props["Select"] = { select: { name: task.taskType } };
  if (task.priority) props["Priority"] = { select: { name: task.priority } };
  if (task.status) {
    props["Status"] = {
      status: { name: NOTION_STATUS_MAP[task.status] ?? NOTION_STATUS_FALLBACK },
    };
  }
  if (task.project) props["Project"] = { select: { name: task.project } };
  if (task.creationDate) {
    props["Created Date"] = { date: { start: toNotionDate(task.creationDate) } };
  }
  if (payload.confirmedDueDate) {
    props["Due Date"] = { date: { start: payload.confirmedDueDate } };
  }
  if (payload.startDate) {
    props["Start Date"] = { date: { start: payload.startDate } };
  }

  return props;
}

function buildBlocks(task: NormalizedTask): BlockObjectRequest[] {
  const blocks: BlockObjectRequest[] = [];

  if (task.description) {
    blocks.push(h2("Description"), ...textToBlocks(task.description));
  }

  if (task.additionDescription) {
    if (blocks.length > 0) blocks.push(divider());
    blocks.push(h2("Addition Description"), ...textToBlocks(task.additionDescription));
  }

  const detailEntries = Object.entries(task.details);
  if (detailEntries.length > 0) {
    if (blocks.length > 0) blocks.push(divider());
    blocks.push(h2("Details"));
    for (const [label, value] of detailEntries) {
      const line = `${label}: ${value}`;
      blocks.push({ paragraph: { rich_text: richText(line) } });
    }
  }

  return blocks;
}

export async function createOrUpdatePage(
  task: NormalizedTask,
  payload: CreatePayload
): Promise<Result<NotionSuccess>> {
  const dataSourceId = process.env.NOTION_DATA_SOURCE_ID;
  if (!dataSourceId) return { ok: false, error: "NOTION_DATA_SOURCE_ID not configured" };
  if (!process.env.NOTION_TOKEN) return { ok: false, error: "NOTION_TOKEN not configured" };

  const client = makeClient();

  try {
    const existing = await client.dataSources.query({
      data_source_id: dataSourceId,
      filter: { property: "ID", rich_text: { equals: task.id } },
      page_size: 1,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const properties = buildProperties(task, payload) as any;

    if (existing.results.length > 0) {
      const page = existing.results[0];
      if (!isFullPageOrDataSource(page)) {
        return { ok: false, error: "Unexpected partial page response" };
      }
      await client.pages.update({ page_id: page.id, properties });
      return { ok: true, data: { pageId: page.id, url: page.url, created: false } };
    }

    const newPage = await client.pages.create({
      parent: { type: "data_source_id", data_source_id: dataSourceId },
      properties,
      children: buildBlocks(task),
    });

    if (!isFullPage(newPage)) {
      return { ok: false, error: "Unexpected partial page response" };
    }

    return { ok: true, data: { pageId: newPage.id, url: newPage.url, created: true } };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: `Notion error: ${msg}` };
  }
}
