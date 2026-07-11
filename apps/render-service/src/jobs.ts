import crypto from "node:crypto";

import type { JobError, JobResult, RenderJob } from "./contracts.js";
import { createDownloadToken } from "./security.js";

export type JobWork<TPayload> = (job: RenderJob<TPayload>) => Promise<JobResult>;

interface QueueItem<TPayload = unknown> {
  job: RenderJob<TPayload>;
  work: JobWork<TPayload>;
}

function nowIso(): string {
  return new Date().toISOString();
}

function normalizeError(error: unknown): JobError {
  if (error instanceof Error) {
    return {
      code: "render_failed",
      message: error.message,
      ...(error.cause === undefined ? {} : { details: error.cause }),
    };
  }
  return { code: "render_failed", message: "Unexpected render failure", details: error };
}

export class JobManager {
  readonly #jobs = new Map<string, RenderJob>();
  readonly #queue: QueueItem[] = [];
  readonly #concurrency: number;
  readonly #ttlMs: number;
  readonly #cleanupTimer: NodeJS.Timeout;
  #active = 0;

  constructor(concurrency: number, ttlMs: number) {
    this.#concurrency = Math.max(1, concurrency);
    this.#ttlMs = Math.max(60_000, ttlMs);
    this.#cleanupTimer = setInterval(() => this.cleanupExpired(), Math.min(this.#ttlMs, 60 * 60 * 1000));
    this.#cleanupTimer.unref();
  }

  enqueue<TPayload>(
    kind: "single" | "batch",
    payload: TPayload,
    work: JobWork<TPayload>,
  ): RenderJob<TPayload> {
    const createdAt = nowIso();
    const job: RenderJob<TPayload> = {
      id: crypto.randomUUID(),
      token: createDownloadToken(),
      kind,
      status: "queued",
      payload,
      createdAt,
      updatedAt: createdAt,
      expiresAt: new Date(Date.now() + this.#ttlMs).toISOString(),
    };
    this.#jobs.set(job.id, job as RenderJob);
    this.#queue.push({ job, work } as QueueItem);
    this.pump();
    return job;
  }

  get(jobId: string): RenderJob | undefined {
    return this.#jobs.get(jobId);
  }

  stats(): { queued: number; active: number; total: number } {
    return { queued: this.#queue.length, active: this.#active, total: this.#jobs.size };
  }

  close(): void {
    clearInterval(this.#cleanupTimer);
  }

  cleanupExpired(): number {
    const now = Date.now();
    let removed = 0;
    for (const [jobId, job] of this.#jobs) {
      if (Date.parse(job.expiresAt) <= now && !["queued", "running"].includes(job.status)) {
        this.#jobs.delete(jobId);
        removed += 1;
      }
    }
    return removed;
  }

  private pump(): void {
    while (this.#active < this.#concurrency) {
      const item = this.#queue.shift();
      if (!item) return;
      this.#active += 1;
      void this.execute(item);
    }
  }

  private async execute(item: QueueItem): Promise<void> {
    const { job, work } = item;
    job.status = "running";
    job.updatedAt = nowIso();
    try {
      job.result = await work(job);
      job.status = "completed";
    } catch (error) {
      job.error = normalizeError(error);
      job.status = "failed";
    } finally {
      job.updatedAt = nowIso();
      this.#active -= 1;
      this.pump();
    }
  }
}
