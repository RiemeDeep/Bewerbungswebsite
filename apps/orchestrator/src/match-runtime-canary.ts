import { z } from "zod";

import type { MatchRuntimeEvent, MatchRuntimeOperation } from "./app.js";

const matchRuntimeEventSchema = z
  .object({
    requestId: z.string().uuid(),
    operation: z.enum(["job_context_preview", "match_analysis", "match_assistant"]),
    status: z.enum(["success", "invalid_request", "unauthorized", "limited", "upstream_error"]),
    durationMs: z.number().int().nonnegative(),
    limitedBy: z.enum(["rate", "daily_budget", "concurrency", "timeout"]).optional(),
  })
  .strict()
  .superRefine((event, context) => {
    if (event.status === "limited" && !event.limitedBy) {
      context.addIssue({ code: "custom", message: "Limited events require limitedBy." });
    }
    if (event.status !== "limited" && event.limitedBy) {
      context.addIssue({ code: "custom", message: "Only limited events may include limitedBy." });
    }
  });

const requiredStatuses = [
  "success",
  "invalid_request",
  "unauthorized",
  "limited",
  "upstream_error",
] as const;
const operations = ["job_context_preview", "match_analysis", "match_assistant"] as const;

type MatchRuntimeCanaryInput = {
  events: MatchRuntimeEvent[];
  privateMarkers: string[];
  callCounts: Record<string, number>;
  callBudgets: Record<string, number>;
  localP95BudgetMs: Record<MatchRuntimeOperation, number>;
};

function percentile95(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.max(0, Math.ceil(sorted.length * 0.95) - 1)] ?? 0;
}

export function evaluateMatchRuntimeCanary(input: MatchRuntimeCanaryInput) {
  const schemaValid = input.events.every(
    (event) => matchRuntimeEventSchema.safeParse(event).success,
  );
  const serializedEvents = JSON.stringify(input.events);
  const privacyValid = input.privateMarkers.every(
    (marker) => marker.length > 0 && !serializedEvents.includes(marker),
  );
  const statuses = new Set(input.events.map((event) => event.status));
  const statusCoverageValid = requiredStatuses.every((status) => statuses.has(status));
  const operationSummaries = operations.map((operation) => {
    const successfulDurations = input.events
      .filter((event) => event.operation === operation && event.status === "success")
      .map((event) => event.durationMs);
    const p95Ms = percentile95(successfulDurations);
    return {
      operation,
      successCount: successfulDurations.length,
      p95Ms,
      budgetMs: input.localP95BudgetMs[operation],
      ok: successfulDurations.length > 0 && p95Ms <= input.localP95BudgetMs[operation],
    };
  });
  const callBudgetValid = Object.entries(input.callBudgets).every(
    ([name, budget]) => (input.callCounts[name] ?? 0) <= budget,
  );
  const operationCoverageValid = operationSummaries.every(({ successCount }) => successCount > 0);
  const latencyValid = operationSummaries.every(({ ok }) => ok);
  const checks = {
    schema: schemaValid,
    privacy: privacyValid,
    statusCoverage: statusCoverageValid,
    operationCoverage: operationCoverageValid,
    localLatency: latencyValid,
    callBudget: callBudgetValid,
  };

  return {
    ok: Object.values(checks).every(Boolean),
    eventCount: input.events.length,
    checks,
    operations: operationSummaries,
    callCounts: input.callCounts,
    callBudgets: input.callBudgets,
  };
}
