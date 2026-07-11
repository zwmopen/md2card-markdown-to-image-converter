import type { ListJobsRequest, RenderJob } from "./contracts.js";

interface CursorValue {
  createdAt: string;
  id: string;
}

export class InvalidJobCursorError extends Error {
  readonly code = "invalid_cursor";
  readonly status = 400;

  constructor(message = "The job list cursor is invalid") {
    super(message);
    this.name = "InvalidJobCursorError";
  }
}

export interface JobListPage {
  items: RenderJob[];
  nextCursor: string | null;
}

function compareKeys(a: CursorValue, b: CursorValue): number {
  const created = b.createdAt.localeCompare(a.createdAt);
  if (created !== 0) return created;
  return b.id.localeCompare(a.id);
}

export function encodeJobCursor(job: CursorValue): string {
  return Buffer.from(JSON.stringify([job.createdAt, job.id]), "utf8").toString("base64url");
}

export function decodeJobCursor(cursor: string): CursorValue {
  try {
    const value: unknown = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8"));
    if (!Array.isArray(value) || value.length !== 2) throw new Error("invalid tuple");
    const [createdAt, id] = value;
    if (typeof createdAt !== "string" || typeof id !== "string" || !createdAt || !id) {
      throw new Error("invalid cursor fields");
    }
    if (!Number.isFinite(Date.parse(createdAt))) throw new Error("invalid cursor date");
    return { createdAt, id };
  } catch {
    throw new InvalidJobCursorError();
  }
}

export function paginateJobs(
  jobs: Iterable<RenderJob>,
  request: ListJobsRequest,
): JobListPage {
  const cursor = request.cursor ? decodeJobCursor(request.cursor) : undefined;
  const sorted = Array.from(jobs)
    .filter((job) => !request.status || job.status === request.status)
    .sort(compareKeys);

  const remaining = cursor
    ? sorted.filter((job) => compareKeys(job, cursor) > 0)
    : sorted;
  const window = remaining.slice(0, request.limit + 1);
  const hasMore = window.length > request.limit;
  const items = hasMore ? window.slice(0, request.limit) : window;
  const last = items.at(-1);

  return {
    items,
    nextCursor: hasMore && last ? encodeJobCursor(last) : null,
  };
}
