import { z } from "zod";

// Raw parsed data from JSON or CSV — polymorphic, ~54 possible fields
export const SourceTaskSchema = z.record(z.string(), z.unknown());
export type SourceTask = z.infer<typeof SourceTaskSchema>;

export const NormalizedTaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  taskType: z.string().optional(),
  priority: z.string().optional(),
  status: z.string().optional(),
  dueDate: z.string().nullable(),
  creationDate: z.string().optional(),
  project: z.string().nullable(),
  description: z.string().nullable(),
  additionDescription: z.string().nullable(),
  details: z.record(z.string(), z.string()),
});
export type NormalizedTask = z.infer<typeof NormalizedTaskSchema>;

export const CreatePayloadSchema = z.object({
  task: NormalizedTaskSchema,
  confirmedTitle: z.string().min(1),
  confirmedDueDate: z.string().nullable(),
  startDate: z.string().nullable(),
});
export type CreatePayload = z.infer<typeof CreatePayloadSchema>;

export const TransformRequestSchema = z.object({
  raw: z.string().min(1).max(2_000_000),
  format: z.enum(["json", "csv"]),
});
export type TransformRequest = z.infer<typeof TransformRequestSchema>;
