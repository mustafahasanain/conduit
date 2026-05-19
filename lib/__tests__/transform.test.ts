import { describe, it, expect } from "vitest";
import { htmlToText } from "@/lib/transform/html-to-text";
import { isEmpty } from "@/lib/transform/normalize";
import { transformTask } from "@/lib/transform/transform";
import { toLabel } from "@/lib/mappers";

describe("htmlToText", () => {
  it("strips tags and preserves text", () => {
    const html = '<div class="ql-editor read-mode"><p>Hello World</p></div>';
    expect(htmlToText(html)).toBe("Hello World");
  });

  it("converts <br> to newline", () => {
    const html = "<p>Line 1<br>Line 2</p>";
    const result = htmlToText(html);
    expect(result).toContain("Line 1");
    expect(result).toContain("Line 2");
  });

  it("converts </p> to newline", () => {
    const html = "<p>A</p><p>B</p>";
    const result = htmlToText(html);
    expect(result).toMatch(/A\n+B/);
  });

  it("decodes &nbsp;", () => {
    expect(htmlToText("<p>A&nbsp;B</p>")).toBe("A B");
  });

  it("decodes &amp;", () => {
    expect(htmlToText("<p>A &amp; B</p>")).toBe("A & B");
  });

  it("decodes &lt; and &gt;", () => {
    expect(htmlToText("<p>&lt;tag&gt;</p>")).toBe("<tag>");
  });

  it("collapses more than two consecutive blank lines", () => {
    const html = "<p>A</p><p><br></p><p><br></p><p><br></p><p>B</p>";
    const result = htmlToText(html);
    expect(result).not.toMatch(/\n{3,}/);
  });

  it("handles the real Quill sample", () => {
    const html =
      '<div class="ql-editor read-mode"><p>Scope of Work:</p><p><br></p><p>1. Workflow:</p><p> &nbsp; - Define stages.</p></div>';
    const result = htmlToText(html);
    expect(result).toContain("Scope of Work:");
    expect(result).toContain("1. Workflow:");
    expect(result).toContain("- Define stages.");
    expect(result).not.toContain("<");
    expect(result).not.toContain("&nbsp;");
  });
});

describe("isEmpty", () => {
  it("treats empty string as empty", () => expect(isEmpty("")).toBe(true));
  it("treats whitespace-only string as empty", () =>
    expect(isEmpty("   ")).toBe(true));
  it("treats null as empty", () => expect(isEmpty(null)).toBe(true));
  it("treats undefined as empty", () => expect(isEmpty(undefined)).toBe(true));
  it("treats 0 as empty", () => expect(isEmpty(0)).toBe(true));
  it("does not treat non-zero number as empty", () =>
    expect(isEmpty(1)).toBe(false));
  it("does not treat non-empty string as empty", () =>
    expect(isEmpty("hello")).toBe(false));
});

describe("toLabel", () => {
  it("converts snake_case to Title Case", () => {
    expect(toLabel("business_purpose")).toBe("Business Purpose");
    expect(toLabel("impact_level")).toBe("Impact Level");
    expect(toLabel("task_type")).toBe("Task Type");
  });

  it("handles special override for server_name_ip", () => {
    expect(toLabel("server_name_ip")).toBe("Server Name / IP");
  });
});

describe("transformTask", () => {
  it("maps core fields correctly", () => {
    const task = transformTask({
      name: "AT-2026-00086",
      title: "Task Title",
      task_type: "Addition",
      priority: "High",
      status: "To Do",
      due_date: "2026-02-28",
      label: "E2NEXT",
      creation: "2026-02-21 08:38:47",
    });

    expect(task.id).toBe("AT-2026-00086");
    expect(task.title).toBe("Task Title");
    expect(task.taskType).toBe("Addition");
    expect(task.priority).toBe("High");
    expect(task.status).toBe("To Do");
    expect(task.dueDate).toBe("2026-02-28");
    expect(task.project).toBe("E2NEXT");
  });

  it("excludes assigned_to entirely", () => {
    const task = transformTask({
      name: "AT-001",
      title: "Test",
      assigned_to: "HR-EMP-00086",
    });
    expect(JSON.stringify(task)).not.toContain("HR-EMP-00086");
    expect(task.details).not.toHaveProperty("Assigned To");
  });

  it("skips empty string fields in details", () => {
    const task = transformTask({
      name: "AT-001",
      title: "Test",
      training_type: "",
      meeting_type: "Call",
    });
    expect(task.details).not.toHaveProperty("Training Type");
    expect(task.details).toHaveProperty("Meeting Type", "Call");
  });

  it("skips numeric-zero fields in details", () => {
    const task = transformTask({
      name: "AT-001",
      title: "Test",
      total_hours_spent: 0,
      overdue_days: 0,
      duration_hours: 0,
    });
    expect(task.details).not.toHaveProperty("Total Hours Spent");
    expect(task.details).not.toHaveProperty("Overdue Days");
  });

  it("cleans HTML from description", () => {
    const task = transformTask({
      name: "AT-001",
      title: "Test",
      description:
        '<div class="ql-editor read-mode"><p>Hello World</p></div>',
    });
    expect(task.description).toBe("Hello World");
  });

  it("keeps addition_description as plain text", () => {
    const task = transformTask({
      name: "AT-001",
      title: "Test",
      addition_description: "Plain text content.",
    });
    expect(task.additionDescription).toBe("Plain text content.");
  });

  it("sets dueDate to null when missing", () => {
    const task = transformTask({ name: "AT-001", title: "Test" });
    expect(task.dueDate).toBeNull();
  });

  it("includes unknown non-empty fields in details", () => {
    const task = transformTask({
      name: "AT-001",
      title: "Test",
      communication_channel: "In-Person",
    });
    expect(task.details).toHaveProperty("Communication Channel", "In-Person");
  });

  it("excludes internal metadata fields", () => {
    const task = transformTask({
      name: "AT-001",
      title: "Test",
      doctype: "A1 Task",
      __last_sync_on: "2026-05-19T18:15:42.139Z",
      owner: "user@example.com",
    });
    expect(task.details).not.toHaveProperty("Doctype");
    expect(task.details).not.toHaveProperty("Owner");
  });
});
