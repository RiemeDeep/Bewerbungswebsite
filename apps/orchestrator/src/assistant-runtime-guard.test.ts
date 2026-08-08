import { describe, expect, it } from "vitest";

import {
  AssistantRuntimeLimitError,
  createAssistantRuntimeGuard,
} from "./assistant-runtime-guard.js";

describe("assistant runtime guard", () => {
  it("enforces the minute request limit", async () => {
    const guard = createAssistantRuntimeGuard({
      maxRequestsPerMinute: 1,
      maxRequestsPerDay: 10,
      maxConcurrentRequests: 1,
      timeoutMs: 100,
      now: () => 1_800_000_000_000,
    });

    await expect(guard.execute(async () => "ok")).resolves.toBe("ok");
    await expect(guard.execute(async () => "blocked")).rejects.toMatchObject({ limit: "rate" });
  });

  it("enforces the daily request budget", async () => {
    let now = 1_800_000_000_000;
    const guard = createAssistantRuntimeGuard({
      maxRequestsPerMinute: 10,
      maxRequestsPerDay: 1,
      maxConcurrentRequests: 1,
      timeoutMs: 100,
      now: () => now,
    });

    await guard.execute(async () => "ok");
    now += 61_000;
    await expect(guard.execute(async () => "blocked")).rejects.toMatchObject({
      limit: "daily_budget",
    });
  });

  it("enforces concurrency without logging or inspecting request content", async () => {
    let releaseRequest: (() => void) | undefined;
    const guard = createAssistantRuntimeGuard({
      maxRequestsPerMinute: 10,
      maxRequestsPerDay: 10,
      maxConcurrentRequests: 1,
      timeoutMs: 1_000,
    });
    const activeRequest = guard.execute(
      () => new Promise<void>((resolve) => (releaseRequest = resolve)),
    );

    await expect(guard.execute(async () => "blocked")).rejects.toMatchObject({
      limit: "concurrency",
    });
    releaseRequest?.();
    await expect(activeRequest).resolves.toBeUndefined();
  });

  it("fails requests that exceed the runtime deadline", async () => {
    const guard = createAssistantRuntimeGuard({
      maxRequestsPerMinute: 10,
      maxRequestsPerDay: 10,
      maxConcurrentRequests: 1,
      timeoutMs: 5,
    });

    await expect(
      guard.execute(() => new Promise((resolve) => setTimeout(resolve, 50))),
    ).rejects.toBeInstanceOf(AssistantRuntimeLimitError);
  });

  it("retains the concurrency slot until timed-out provider work actually settles", async () => {
    let releaseRequest: (() => void) | undefined;
    const guard = createAssistantRuntimeGuard({
      maxRequestsPerMinute: 10,
      maxRequestsPerDay: 10,
      maxConcurrentRequests: 1,
      timeoutMs: 5,
    });

    await expect(
      guard.execute(() => new Promise<void>((resolve) => (releaseRequest = resolve))),
    ).rejects.toMatchObject({ limit: "timeout" });
    await expect(guard.execute(async () => "blocked")).rejects.toMatchObject({
      limit: "concurrency",
    });
    releaseRequest?.();
    await new Promise((resolve) => setTimeout(resolve, 0));
    await expect(guard.execute(async () => "available")).resolves.toBe("available");
  });

  it("aborts underlying work when the runtime deadline expires", async () => {
    let observedAbort = false;
    const guard = createAssistantRuntimeGuard({
      maxRequestsPerMinute: 10,
      maxRequestsPerDay: 10,
      maxConcurrentRequests: 1,
      timeoutMs: 5,
    });

    await expect(
      guard.execute(
        (signal) =>
          new Promise<void>((_resolve, reject) => {
            signal.addEventListener("abort", () => {
              observedAbort = true;
              reject(new DOMException("Aborted", "AbortError"));
            });
          }),
      ),
    ).rejects.toMatchObject({ limit: "timeout" });
    expect(observedAbort).toBe(true);
  });
});
