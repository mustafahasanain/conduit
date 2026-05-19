/**
 * Usage: npx tsx scripts/notion-datasource.ts <database_id>
 *
 * Requires NOTION_TOKEN in the environment. Prints the data source IDs
 * associated with the given Notion database so you can set NOTION_DATA_SOURCE_ID.
 */

import { Client, isFullDatabase } from "@notionhq/client";

const databaseId = process.argv[2];
if (!databaseId) {
  console.error("Usage: npx tsx scripts/notion-datasource.ts <database_id>");
  process.exit(1);
}

const token = process.env.NOTION_TOKEN;
if (!token) {
  console.error("Error: NOTION_TOKEN environment variable is not set.");
  console.error("Set it with:  NOTION_TOKEN=ntn_... npx tsx scripts/notion-datasource.ts <id>");
  process.exit(1);
}

const client = new Client({ auth: token, notionVersion: "2026-03-11" });

async function main() {
  const db = await client.databases.retrieve({ database_id: databaseId });

  if (!isFullDatabase(db)) {
    console.error("Error: Could not retrieve full database details. Check the database ID and token permissions.");
    process.exit(1);
  }

  console.log(`\nDatabase: "${db.title.map((t) => t.plain_text).join("")}"`);
  console.log(`URL: ${db.url}\n`);

  if (db.data_sources.length === 0) {
    console.log("No data sources found. Ensure the integration has access to this database.");
    process.exit(1);
  }

  console.log("Data sources:");
  for (const ds of db.data_sources) {
    console.log(`  ID:   ${ds.id}`);
    console.log(`  Name: ${ds.name}`);
    console.log();
  }

  console.log("Add to .env.local:");
  console.log(`  NOTION_DATA_SOURCE_ID=${db.data_sources[0].id}`);
}

main().catch((err) => {
  console.error("Error:", err instanceof Error ? err.message : err);
  process.exit(1);
});
