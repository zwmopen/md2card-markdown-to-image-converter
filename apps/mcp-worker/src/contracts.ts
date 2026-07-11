import { z } from "zod";

export const DEFAULT_MAX_BATCH_SIZE = 20;

export const ThemeModeSchema = z.enum(["light", "dark", "auto"]);
export const SplitModeSchema = z.enum(["auto", "hr", "none"]);
export const OutputFormatSchema = z.enum(["png", "jpeg", "webp"]);

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

export const GetJobRequestSchema = z
  .object({
    jobId: z.string().trim().min(1).max(160),
  })
  .strict();

export type RenderRequest = z.infer<typeof RenderRequestSchema>;
export type BatchRenderRequest = z.infer<typeof BatchRenderRequestSchema>;
export type GetJobRequest = z.infer<typeof GetJobRequestSchema>;

export interface RendererResponse {
  ok: boolean;
  jobId?: string;
  status?: string;
  resultUrl?: string;
  downloadUrl?: string;
  expiresAt?: string;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  [key: string]: unknown;
}
