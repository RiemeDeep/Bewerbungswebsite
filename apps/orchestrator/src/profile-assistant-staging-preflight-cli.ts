import { readFile } from "node:fs/promises";
import { isAbsolute, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { validateProfileAssistantStagingPreflight } from "./profile-assistant-staging-preflight.js";

type PreflightCliIo = {
  cwd: string;
  env: Record<string, string | undefined>;
  readFile(path: string): Promise<string>;
};

function parseArguments(argv: string[]) {
  const options = new Map<string, string>();
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (!argument?.startsWith("--")) continue;
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`Missing value for ${argument}.`);
    }
    options.set(argument.slice(2), value);
    index += 1;
  }
  return options;
}

function parseEnvFile(content: string) {
  const environment: Record<string, string> = {};
  for (const rawLine of content.split(/\r?\n/u)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = line.slice(0, separatorIndex).trim();
    const value = line
      .slice(separatorIndex + 1)
      .trim()
      .replace(/^['"]|['"]$/gu, "");
    if (key) environment[key] = value;
  }
  return environment;
}

async function readEnvFile(path: string, io: PreflightCliIo) {
  const baseDirectory = io.env.INIT_CWD ?? io.cwd;
  const resolvedPath = isAbsolute(path) ? path : resolve(baseDirectory, path);
  return parseEnvFile(await io.readFile(resolvedPath));
}

export async function runProfileAssistantStagingPreflightCli(
  argv: string[],
  io: PreflightCliIo = {
    cwd: process.cwd(),
    env: process.env,
    readFile: (path) => readFile(path, "utf8"),
  },
) {
  const options = parseArguments(argv);
  const webEnvPath = options.get("web-env");
  const orchestratorEnvPath = options.get("orchestrator-env");
  if (!webEnvPath || !orchestratorEnvPath) {
    throw new Error(
      "Usage: profile-assistant:staging:preflight --web-env <path> --orchestrator-env <path> [--backup-restore-verified 1]",
    );
  }

  const result = validateProfileAssistantStagingPreflight({
    webEnvironment: await readEnvFile(webEnvPath, io),
    orchestratorEnvironment: await readEnvFile(orchestratorEnvPath, io),
    backupRestoreVerified: options.get("backup-restore-verified") === "1",
  });

  return {
    exitCode: result.ok ? 0 : 1,
    stdout: `${JSON.stringify(result, null, 2)}\n`,
  };
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  runProfileAssistantStagingPreflightCli(process.argv.slice(2))
    .then((result) => {
      process.stdout.write(result.stdout);
      if (result.exitCode !== 0) process.exitCode = result.exitCode;
    })
    .catch((error: unknown) => {
      console.error(
        error instanceof Error ? error.message : "Profile assistant staging preflight failed.",
      );
      process.exitCode = 1;
    });
}
