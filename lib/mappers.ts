// CSV column header → JSON field name
export const CSV_TO_JSON_KEY: Record<string, string> = {
  "ID": "name",
  "Series": "naming_series",
  "Title": "title",
  "Task Type": "task_type",
  "Priority": "priority",
  "Status": "status",
  "Due Date": "due_date",
  "Assigned To": "assigned_to",
  "Label": "label",
  "Work Start Time": "work_start_time",
  "Work End Time": "work_end_time",
  "Total Hours Spent": "total_hours_spent",
  "Overdue Days": "overdue_days",
  "Training Title": "training_title",
  "Duration (Hours)": "duration_hours",
  "Training Type": "training_type",
  "Training Content": "training_content",
  "Meeting Subject": "meeting_subject",
  "Meeting Date": "meeting_date",
  "Meeting Type": "meeting_type",
  "Discussion Points": "discussion_points",
  "Task Category": "task_category",
  "Internal Task Description": "internal_task_description",
  "Reference Document": "reference_document",
  "Requested By": "requested_by",
  "Change Description": "change_description",
  "Impact Level": "impact_level",
  "Change Type": "change_type",
  "Reason": "reason",
  "Execution Priority": "execution_priority",
  "Requested By Addition": "requested_by_addition",
  "Related System": "related_system",
  "Addition Description": "addition_description",
  "Addition Type": "addition_type",
  "Business Purpose": "business_purpose",
  "Reference Example": "reference_example",
  "Request Type": "request_type",
  "Request Description": "request_description",
  "Requested By Support": "requested_by_support",
  "Communication Channel": "communication_channel",
  "Server Type": "server_type",
  "Requested Action": "requested_action",
  "Execution Date": "execution_date",
  "Server Name / IP": "server_name_ip",
  "Reason Server": "reason_server",
  "Post execution Issues": "post_execution_issues",
  "Incident Type": "incident_type",
  "Affected System": "affected_system",
  "Repeated Incident": "repeated_incident",
  "Impact Level Incident": "impact_level_incident",
  "Incident Date": "incident_date",
  "Root Cause": "root_cause",
  "Action Taken": "action_taken",
  "Other Description": "description",
};

// Special label overrides for keys that don't snake_case cleanly
const LABEL_OVERRIDES: Record<string, string> = {
  server_name_ip: "Server Name / IP",
};

// snake_case key → "Human Readable Label"
export function toLabel(key: string): string {
  if (key in LABEL_OVERRIDES) return LABEL_OVERRIDES[key];
  return key
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// Source status → Notion status option name. Edit to match your Notion setup.
export const NOTION_STATUS_MAP: Record<string, string> = {
  "To Do": "Planned",
  "In Progress": "In Progress",
  "Pending Review": "In Review",
  "Completed": "Done",
  "Cancelled": "Cancelled",
  "Overdue": "Planned",
};
export const NOTION_STATUS_FALLBACK = "Planned";

// Source priority → TickTick priority integer
export const TICKTICK_PRIORITY_MAP: Record<string, number> = {
  "Low": 1,
  "Medium": 3,
  "High": 5,
  "Critical": 5,
};
export const TICKTICK_PRIORITY_DEFAULT = 0;
