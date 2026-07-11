import type { RenderJob, RenderedFile, ResultPreference } from "./contracts.js";

export type ResultSelectionErrorCode =
  | "result_not_ready"
  | "result_failed"
  | "result_cancelled"
  | "result_unavailable";

export class ResultSelectionError extends Error {
  readonly code: ResultSelectionErrorCode;
  readonly status: number;

  constructor(code: ResultSelectionErrorCode, message: string, status = 409) {
    super(message);
    this.name = "ResultSelectionError";
    this.code = code;
    this.status = status;
  }
}

export interface ResultSelection {
  preference: ResultPreference;
  selected: RenderedFile;
  primaryFile?: RenderedFile;
  archiveFile?: RenderedFile;
  files: RenderedFile[];
}

export function selectJobResult(
  job: RenderJob,
  preference: ResultPreference,
): ResultSelection {
  if (job.status === "failed") {
    throw new ResultSelectionError(
      "result_failed",
      job.error?.message || "The render job failed and has no downloadable result",
    );
  }
  if (job.status === "cancelled") {
    throw new ResultSelectionError(
      "result_cancelled",
      "The render job was cancelled and has no downloadable result",
    );
  }
  if (job.status !== "completed") {
    throw new ResultSelectionError(
      "result_not_ready",
      `The render job is ${job.status}; wait until it is completed`,
    );
  }

  const primaryFile = job.result?.primaryFile;
  const archiveFile = job.result?.archiveFile;
  const files = job.result?.files ?? [];
  let selected: RenderedFile | undefined;

  if (preference === "archive") selected = archiveFile;
  else if (preference === "primary") selected = primaryFile;
  else selected = archiveFile ?? primaryFile;

  if (!selected) {
    throw new ResultSelectionError(
      "result_unavailable",
      preference === "archive"
        ? "This job does not have an archive result"
        : preference === "primary"
          ? "This job does not have a primary image result"
          : "This completed job does not contain a downloadable result",
    );
  }

  return {
    preference,
    selected,
    ...(primaryFile ? { primaryFile } : {}),
    ...(archiveFile ? { archiveFile } : {}),
    files,
  };
}
