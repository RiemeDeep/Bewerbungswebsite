export type AssistantRuntimeLimit = "rate" | "daily_budget" | "concurrency" | "timeout";

export class AssistantRuntimeLimitError extends Error {
  constructor(
    readonly limit: AssistantRuntimeLimit,
    readonly retryAfterSeconds: number,
  ) {
    super(`Assistant runtime rejected the request due to ${limit}.`);
    this.name = "AssistantRuntimeLimitError";
  }
}

export type AssistantRuntimeGuard = {
  execute<T>(operation: (signal: AbortSignal) => Promise<T>): Promise<T>;
};

export function createAssistantRuntimeGuard(options: {
  maxRequestsPerMinute: number;
  maxRequestsPerDay: number;
  maxConcurrentRequests: number;
  timeoutMs: number;
  now?: () => number;
}): AssistantRuntimeGuard {
  const now = options.now ?? Date.now;
  let minuteRequests: number[] = [];
  let dailyRequestCount = 0;
  let dailyRequestKey = "";
  let activeRequests = 0;

  return {
    async execute(operation) {
      const startedAt = now();
      const currentDay = new Date(startedAt).toISOString().slice(0, 10);
      if (dailyRequestKey !== currentDay) {
        dailyRequestKey = currentDay;
        dailyRequestCount = 0;
      }

      minuteRequests = minuteRequests.filter((timestamp) => startedAt - timestamp < 60_000);
      if (minuteRequests.length >= options.maxRequestsPerMinute) {
        const oldestRequest = minuteRequests[0] ?? startedAt;
        throw new AssistantRuntimeLimitError(
          "rate",
          Math.max(1, Math.ceil((60_000 - (startedAt - oldestRequest)) / 1_000)),
        );
      }
      if (dailyRequestCount >= options.maxRequestsPerDay) {
        const nextDay = Date.parse(`${currentDay}T00:00:00.000Z`) + 86_400_000;
        throw new AssistantRuntimeLimitError(
          "daily_budget",
          Math.max(1, Math.ceil((nextDay - startedAt) / 1_000)),
        );
      }
      if (activeRequests >= options.maxConcurrentRequests) {
        throw new AssistantRuntimeLimitError("concurrency", 1);
      }

      minuteRequests.push(startedAt);
      dailyRequestCount += 1;
      activeRequests += 1;

      const controller = new AbortController();
      const operationPromise = Promise.resolve().then(() => operation(controller.signal));
      void operationPromise.then(
        () => {
          activeRequests -= 1;
        },
        () => {
          activeRequests -= 1;
        },
      );

      let timeout: NodeJS.Timeout | undefined;
      try {
        return await Promise.race([
          operationPromise,
          new Promise<never>((_resolve, reject) => {
            timeout = setTimeout(() => {
              controller.abort();
              reject(new AssistantRuntimeLimitError("timeout", 1));
            }, options.timeoutMs);
          }),
        ]);
      } finally {
        if (timeout) clearTimeout(timeout);
      }
    },
  };
}
