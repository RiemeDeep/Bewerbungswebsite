import { createHash } from "node:crypto";

import { Pool } from "pg";
import { z } from "zod";

import {
  accessibleMatchAnalysisSchema,
  jobContextSchema,
  matchAnalysisAccessMetadataSchema,
  matchAnalysisSchema,
  type AccessibleMatchAnalysis,
  type JobContext,
  type MatchAnalysis,
  type MatchAnalysisAccessMetadata,
} from "@bewerbungswebsite/contracts";

import { createMatchAnalysisAccessMetadata } from "./match-access.js";

type QueryResult = {
  rows: Record<string, unknown>[];
  rowCount: number | null;
};

type Queryable = {
  query(text: string, values: unknown[]): Promise<QueryResult>;
};

export type CreateStoredMatchAnalysisInput = {
  jobContext: JobContext;
  matchAnalysis: MatchAnalysis;
  ttlHours?: number;
};

export interface MatchAnalysisStore {
  create(input: CreateStoredMatchAnalysisInput): Promise<MatchAnalysisAccessMetadata>;
  getByAccessToken(accessToken: string): Promise<AccessibleMatchAnalysis | null>;
  expireDue(now: string): Promise<number>;
  hardDeleteExpired(before: string): Promise<number>;
  deleteByAnalysisId(analysisId: string, deletedAt: string): Promise<boolean>;
}

type MatchAnalysisStoreOptions = {
  now?: () => Date;
  accessMetadataFactory?: (ttlHours?: number) => MatchAnalysisAccessMetadata;
};

const databaseTimestampSchema = z
  .union([z.date(), z.string().datetime({ offset: true })])
  .transform((value) => (value instanceof Date ? value.toISOString() : value));

const accessibleRowSchema = z
  .object({
    analysis_id: z.string().uuid(),
    job_context: z.unknown(),
    match_analysis: z.unknown(),
    created_at: databaseTimestampSchema,
    expires_at: databaseTimestampSchema,
    robots_directive: z.literal("noindex,nofollow"),
  })
  .strict();

const insertMatchAnalysisSql = `
  insert into public.match_analyses (
    id,
    access_token_hash,
    job_context,
    match_analysis,
    consent_scope,
    robots_directive,
    status,
    created_at,
    expires_at
  )
  values ($1::uuid, $2, $3::jsonb, $4::jsonb, 'single_match_result', $5, 'active', $6, $7)
`;

const getMatchAnalysisSql = `
  select
    id::text as analysis_id,
    job_context,
    match_analysis,
    created_at,
    expires_at,
    robots_directive
  from public.match_analyses
  where access_token_hash = $1
    and status = 'active'
    and expires_at > $2::timestamptz
  limit 1
`;

const expireDueSql = `
  update public.match_analyses
  set status = 'expired'
  where status = 'active'
    and expires_at <= $1::timestamptz
`;

const deleteMatchAnalysisSql = `
  update public.match_analyses
  set status = 'deleted', deleted_at = $2::timestamptz
  where id = $1::uuid
    and status <> 'deleted'
`;

const hardDeleteExpiredSql = `
  delete from public.match_analyses
  where status in ('expired', 'deleted')
    and expires_at <= $1::timestamptz
`;

export function hashMatchAnalysisAccessToken(accessToken: string): string {
  const token = z
    .string()
    .regex(/^[A-Za-z0-9_-]{43,128}$/u)
    .parse(accessToken);
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function createPostgresMatchAnalysisStore(
  client: Queryable,
  options: MatchAnalysisStoreOptions = {},
): MatchAnalysisStore {
  const now = options.now ?? (() => new Date());

  return {
    async create(input) {
      const jobContext = jobContextSchema.parse(input.jobContext);
      const matchAnalysis = matchAnalysisSchema.parse(input.matchAnalysis);
      const access = matchAnalysisAccessMetadataSchema.parse(
        options.accessMetadataFactory
          ? options.accessMetadataFactory(input.ttlHours)
          : createMatchAnalysisAccessMetadata({
              now,
              ...(input.ttlHours === undefined ? {} : { ttlHours: input.ttlHours }),
            }),
      );
      const accessTokenHash = hashMatchAnalysisAccessToken(access.accessToken);

      await client.query(insertMatchAnalysisSql, [
        access.analysisId,
        accessTokenHash,
        JSON.stringify(jobContext),
        JSON.stringify(matchAnalysis),
        access.robotsDirective,
        access.createdAt,
        access.expiresAt,
      ]);

      return access;
    },

    async getByAccessToken(accessToken) {
      const accessTokenHash = hashMatchAnalysisAccessToken(accessToken);
      const result = await client.query(getMatchAnalysisSql, [
        accessTokenHash,
        now().toISOString(),
      ]);
      const rawRow = result.rows[0];
      if (!rawRow) {
        return null;
      }

      const row = accessibleRowSchema.parse(rawRow);
      return accessibleMatchAnalysisSchema.parse({
        analysisId: row.analysis_id,
        jobContext: jobContextSchema.parse(row.job_context),
        matchAnalysis: matchAnalysisSchema.parse(row.match_analysis),
        createdAt: row.created_at,
        expiresAt: row.expires_at,
        robotsDirective: row.robots_directive,
      });
    },

    async expireDue(expiryTime) {
      const parsedExpiryTime = z.string().datetime({ offset: true }).parse(expiryTime);
      const result = await client.query(expireDueSql, [parsedExpiryTime]);
      return result.rowCount ?? 0;
    },

    async hardDeleteExpired(before) {
      const parsedBefore = z.string().datetime({ offset: true }).parse(before);
      const result = await client.query(hardDeleteExpiredSql, [parsedBefore]);
      return result.rowCount ?? 0;
    },

    async deleteByAnalysisId(analysisId, deletedAt) {
      const parsedAnalysisId = z.string().uuid().parse(analysisId);
      const parsedDeletedAt = z.string().datetime({ offset: true }).parse(deletedAt);
      const result = await client.query(deleteMatchAnalysisSql, [
        parsedAnalysisId,
        parsedDeletedAt,
      ]);
      return (result.rowCount ?? 0) > 0;
    },
  };
}

export function createPostgresPoolMatchAnalysisStore(
  connectionString: string,
  options: MatchAnalysisStoreOptions = {},
): MatchAnalysisStore & { close(): Promise<void> } {
  const pool = new Pool({ connectionString });
  const store = createPostgresMatchAnalysisStore(pool, options);

  return {
    ...store,
    async close() {
      await pool.end();
    },
  };
}
