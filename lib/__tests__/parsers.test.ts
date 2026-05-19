import { describe, it, expect } from "vitest";
import { parseJSON } from "@/lib/parsers/json";
import { parseCSV } from "@/lib/parsers/csv";

describe("parseJSON", () => {
  it("parses a single object", () => {
    const result = parseJSON('{"name":"AT-001","title":"Test Task"}');
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ name: "AT-001", title: "Test Task" });
  });

  it("parses an array of objects", () => {
    const result = parseJSON('[{"name":"AT-001"},{"name":"AT-002"}]');
    expect(result).toHaveLength(2);
    expect((result[0] as Record<string, unknown>)["name"]).toBe("AT-001");
  });

  it("throws on invalid JSON", () => {
    expect(() => parseJSON("not json")).toThrow("Invalid JSON");
  });

  it("throws on non-object JSON", () => {
    expect(() => parseJSON('"just a string"')).toThrow();
  });
});

describe("parseCSV", () => {
  it("maps CSV headers to JSON keys", () => {
    const csv = `"ID","Title","Priority"\n"AT-001","Test Task","High"`;
    const result = parseCSV(csv);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      name: "AT-001",
      title: "Test Task",
      priority: "High",
    });
  });

  it("handles multi-line quoted cells", () => {
    const csv = `"ID","Addition Description"\n"AT-001","Line 1\nLine 2\nLine 3"`;
    const result = parseCSV(csv);
    expect(result).toHaveLength(1);
    const desc = String((result[0] as Record<string, unknown>)["addition_description"]);
    expect(desc).toContain("Line 1");
    expect(desc).toContain("Line 2");
    expect(desc).toContain("Line 3");
  });

  it("maps 'Other Description' to description key", () => {
    const csv = `"ID","Other Description"\n"AT-001","<p>Hello</p>"`;
    const result = parseCSV(csv);
    expect(result[0]).toMatchObject({ description: "<p>Hello</p>" });
  });

  it("skips empty lines", () => {
    const csv = `"ID","Title"\n"AT-001","Task 1"\n\n`;
    const result = parseCSV(csv);
    expect(result).toHaveLength(1);
  });
});
