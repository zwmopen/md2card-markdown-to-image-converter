import { z } from "zod";

export const DEFAULT_MAX_BATCH_SIZE = 20;

export const ThemeModeSchema = z.enum(["light", "dark", "auto"]);
export const SplitModeSchema = z.enum(["auto", "hr", "none"]);
export const OutputFormatSchema = z.enum(["png", "jpeg", "webp"]);
export const ResultPreferenceSchema = z.enum(["auto", "archive", "primary"]);

export const RenderRequestSchema = z
  .object({
    markdown: z
      .string()
      .min(1, "markdown must not be empty")
      .max(200_000, "markdown exceeds the 200,000 character limit"),
    title: z.string().trim().min(1).max(120).optional(),
    theme: z.string().trim().min(1).max(80).default("xiaohongshu"),
    themeMode: ThemeModeSchema.default("light"),
    width: z.number().int().min(240).max(4096).default(400),
    height: z.number().int().min(240).max(4096).default(533),
    splitMode: SplitModeSchema.default("auto"),
    outputFormat: OutputFormatSchema.default("png"),
    overHiddenMode: z.boolean().default(false),
    mdxMode: z.boolean().default(false),
  })
  .strict();

export const BatchRenderItemSchema = RenderRequestSchema.extend({
  id: z.string().trim().min(1).max(100),
});

export const BatchRenderRequestSchema = z
  .object({
    documents: z
      .array(BatchRenderItemSchema)
      .min(1, "documents must contain at least one item")
      .max(DEFAULT_MAX_BATCH_SIZE),
    archiveName: z.string().trim().min(1).max(120).default("md2card-batch"),
  })
  .strict();

export type RenderRequest = z.infer<typeof RenderRequestSchema>;
export type BatchRenderItem = z.infer<typeof BatchRenderItemSchema>;
export type BatchRenderRequest = z.infer<typeof BatchRenderRequestSchema>;
export type OutputFormat = z.infer<typeof OutputFormatSchema>;
export type ResultPreference = z.infer<typeof ResultPreferenceSchema>;

export type JobStatus = "queued" | "running" | "completed" | "failed" | "cancelled";

export interface RenderedFile {
  name: string;
  relativePath: string;
  mediaType: string;
  size: number;
}

export interface JobResult {
  files: RenderedFile[];
  primaryFile?: RenderedFile;
  archiveFile?: RenderedFile;
}

export interface JobError {
  code: string;
  message: string;
  details?: unknown;
}

export interface RenderJob<TPayload = unknown> {
  id: string;
  token: string;
  kind: "single" | "batch";
  status: JobStatus;
  payload: TPayload;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  retryOf?: string;
  result?: JobResult;
  error?: JobError;
}
