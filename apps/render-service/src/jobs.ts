import crypto from "node:crypto";

import type { JobError, JobResult, RenderJob } from "./contracts.js";
import type { JobStore } from "./job-store.js";
import { createDownloadToken } from "./security.js";

export type JobWork<TPayload> = (
  job: RenderJob<TPayload>,
  signal: AbortSignal,
) => Promise<JobResult>;
export type JobOutputCleanup = (jobId: string) => Promise<void>;

export interface EnqueueOptions {
  retryOf?: string;
}

export interface CancelResult {
  job: RenderJob | undefined;
  cancelled: boolean;
}

interface QueueItem<TPayload = unknown> {
  job: RenderJob<TPayload>;
  work: JobWork<TPayload>;
  controller: AbortController;
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

function cancellationError(): JobError {
  return {
    code: "job_cancelled",
    message: "The render job was cancelled",
  };
}

function isTerminal(job: RenderJob): boolean {
  return ["completed", "failed", "cancelled"].includes(job.status);
}

export class JobManager {
  readonly #jobs = new Map<string, RenderJob>();
  readonly #queue: QueueItem[] = [];
  readonly #controllers = new Map<string, AbortController>();
  readonly #concurrency: number;
  readonly #ttlMs: number;
  readonly #store: JobStore;
  readonly #onOutputCleanup: JobOutputCleanup | undefined;
  readonly #cleanupTimer: NodeJS.Timeout;
  #active = 0;

  constructor(
    concurrency: number,
    ttlMs: number,
    store: JobStore = NOOP_STORE,
    onOutputCleanup?: JobOutputCleanup,
  ) {
    this.#concurrency = Math.max(1, concurrency);
    this.#ttlMs = Math.max(60_000, ttlMs);
    this.#store = store;
    this.#onOutputCleanup = onOutputCleanup;
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
    options: EnqueueOptions = {},
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
      ...(options.retryOf ? { retryOf: options.retryOf } : {}),
    };
    const controller = new AbortController();
    await this.#store.save(job as RenderJob);
    this.#jobs.set(job.id, job as RenderJob);
    this.#controllers.set(job.id, controller);
    this.#queue.push({ job, work, controller } as QueueItem);
    this.pump();
    return job;
  }

  get(jobId: string): RenderJob | undefined {
    return this.#jobs.get(jobId);
  }

  async cancel(jobId: string): Promise<CancelResult> {
    const job = this.#jobs.get(jobId);
    if (!job) return { job: undefined, cancelled: false };
    if (isTerminal(job)) return { job, cancelled: false };

    const queuedIndex = this.#queue.findIndex((item) => item.job.id === jobId);
    const controller = this.#controllers.get(jobId);
    if (queuedIndex >= 0) this.#queue.splice(queuedIndex, 1);

    job.status = "cancelled";
    job.error = cancellationError();
    job.updatedAt = nowIso();
    controller?.abort("job cancelled");
    if (queuedIndex >= 0) this.#controllers.delete(jobId);

    await this.#store.save(job);
    if (queuedIndex >= 0) {
      await this.cleanupOutput(jobId);
      this.pump();
    }

    return { job, cancelled: true };
  }

  stats(): { queued: number; active: number; total: number } {
    return { queued: this.#queue.length, active: this.#active, total: this.#jobs.size };
  }

  close(): void {
    clearInterval(this.#cleanupTimer);
    for (const controller of this.#controllers.values()) {
      controller.abort("renderer shutting down");
    }
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
    await this.cleanupOutput(jobId);
  }

  private async cleanupOutput(jobId: string): Promise<void> {
    if (this.#onOutputCleanup) await this.#onOutputCleanup(jobId);
  }

  private pump(): void {
    while (this.#active < this.#concurrency) {
      const item = this.#queue.shift();
      if (!item) return;
      if (item.job.status === "cancelled" || item.controller.signal.aborted) {
        this.#controllers.delete(item.job.id);
        continue;
      }
      this.#active += 1;
      void this.execute(item);
    }
  }

  private async execute(item: QueueItem): Promise<void> {
    const { job, work, controller } = item;
    job.status = "running";
    job.updatedAt = nowIso();
    try {
      await this.#store.save(job);
      const result = await work(job, controller.signal);
      controller.signal.throwIfAborted();
      job.result = result;
      delete job.error;
      job.status = "completed";
    } catch (error) {
      if (controller.signal.aborted) {
        job.status = "cancelled";
        job.error = cancellationError();
        delete job.result;
      } else {
        job.error = normalizeError(error);
        job.status = "failed";
      }
    } finally {
      job.updatedAt = nowIso();
      try {
        await this.#store.save(job);
        if (job.status === "cancelled") await this.cleanupOutput(job.id);
      } catch (error) {
        console.error("Failed to persist render job state", error);
      }
      this.#controllers.delete(job.id);
      this.#active -= 1;
      this.pump();
    }
  }
}
