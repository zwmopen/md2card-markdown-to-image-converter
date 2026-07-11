import crypto from "node:crypto";

import type { JobError, JobResult, RenderJob } from "./contracts.js";
import type { JobStore } from "./job-store.js";
import { createDownloadToken } from "./security.js";

export type JobWork<TPayload> = (job: RenderJob<TPayload>) => Promise<JobResult>;
export type JobExpiryHandler = (jobId: string) => Promise<void>;

interface QueueItem<TPayload = unknown> {
  job: RenderJob<TPayload>;
  work: JobWork<TPayload>;
}

const NOOP_STORE: JobStore = {
  async init() {},
  async load() { return []; },
  async save() {},
  async remove() {},
};

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
  readonly #store: JobStore;
  readonly #onExpire: JobExpiryHandler | undefined;
  readonly #cleanupTimer: NodeJS.Timeout;
  #active = 0;

  constructor(
    concurrency: number,
    ttlMs: number,
    store: JobStore = NOOP_STORE,
    onExpire?: JobExpiryHandler,
  ) {
    this.#concurrency = Math.max(1, concurrency);
    this.#ttlMs = Math.max(60_000, ttlMs);
    this.#store = store;
    this.#onExpire = onExpire;
    this.#cleanupTimer = setInterval(() => {
      void this.cleanupExpired().catch((error) => {
        console.error("Failed to clean expired render jobs", error);
      });
    }, Math.min(this.#ttlMs, 60 * 60 * 1000));
    this.#cleanupTimer.unref();
  }

  async initialize(): Promise<number> {
    await this.#store.init();
    const persistedJobs = await this.#store.load();
    const now = Date.now();
    let loaded = 0;

    for (const job of persistedJobs) {
      if (Date.parse(job.expiresAt) <= now) {
        await this.removePersistedJob(job.id);
        continue;
      }

      if (job.status === "queued" || job.status === "running") {
        job.status = "failed";
        job.error = {
          code: "renderer_restarted",
          message: "The renderer restarted before this job completed",
        };
        job.updatedAt = nowIso();
        await this.#store.save(job);
      }

      this.#jobs.set(job.id, job);
      loaded += 1;
    }

    return loaded;
  }

  async enqueue<TPayload>(
    kind: "single" | "batch",
    payload: TPayload,
    work: JobWork<TPayload>,
  ): Promise<RenderJob<TPayload>> {
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
    await this.#store.save(job as RenderJob);
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

  async cleanupExpired(): Promise<number> {
    const now = Date.now();
    let removed = 0;
    for (const [jobId, job] of this.#jobs) {
      if (Date.parse(job.expiresAt) <= now && !["queued", "running"].includes(job.status)) {
        this.#jobs.delete(jobId);
        await this.removePersistedJob(jobId);
        removed += 1;
      }
    }
    return removed;
  }

  private async removePersistedJob(jobId: string): Promise<void> {
    await this.#store.remove(jobId);
    if (this.#onExpire) await this.#onExpire(jobId);
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
      await this.#store.save(job);
      job.result = await work(job);
      job.status = "completed";
    } catch (error) {
      job.error = normalizeError(error);
      job.status = "failed";
    } finally {
      job.updatedAt = nowIso();
      try {
        await this.#store.save(job);
      } catch (error) {
        console.error("Failed to persist render job state", error);
      }
      this.#active -= 1;
      this.pump();
    }
  }
}
