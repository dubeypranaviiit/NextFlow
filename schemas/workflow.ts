import { z } from "zod";

export const executionStateSchema = z.enum(["idle", "queued", "running", "success", "failed"]);
export const nodeKindSchema = z.enum(["request_inputs", "crop_image", "gemini", "response"]);
export const portTypeSchema = z.enum(["text", "image", "video", "audio", "file", "number", "any"]);

export const requestFieldSchema = z.object({
  id: z.string(),
  label: z.string().min(1),
  kind: z.enum(["text_field", "image_field"]),
  value: z.string(),
  imageUrl: z.string().url().optional()
});

export const inputConfigSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: portTypeSchema,
  value: z.union([z.string(), z.number()]).optional(),
  connected: z.boolean().optional()
});

export const outputConfigSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: portTypeSchema,
  value: z.string().optional()
});

export const workflowNodeDataSchema = z.object({
  title: z.string(),
  kind: nodeKindSchema,
  locked: z.boolean().optional(),
  status: executionStateSchema.optional(),
  fields: z.array(requestFieldSchema).optional(),
  inputs: z.array(inputConfigSchema).optional(),
  outputs: z.array(outputConfigSchema).optional(),
  systemPrompt: z.string().optional(),
  prompt: z.string().optional(),
  model: z.string().optional(),
  response: z.string().optional(),
  settingsOpen: z.boolean().optional(),
  durationMs: z.number().optional(),
  error: z.string().optional()
});

export const workflowSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
  userId: z.string(),
  nodes: z.array(z.any()),
  edges: z.array(z.any()),
  viewport: z.object({ x: z.number(), y: z.number(), zoom: z.number() }),
  updatedAt: z.string(),
  status: executionStateSchema
});

export const createWorkflowSchema = z.object({
  name: z.string().min(1).max(80)
});

export const importWorkflowSchema = workflowSchema.omit({ id: true, userId: true, updatedAt: true }).partial({
  viewport: true,
  status: true
});
