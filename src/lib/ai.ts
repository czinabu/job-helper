"use client";

import { listClaudeModels, runClaudeTask } from "./claude";
import { FriendlyError } from "./errors";
import { listLocalModels, runLocalTask } from "./local";
import { PROVIDERS, type ModelSettings, type TestConnectionResult } from "./providers";
import { TASKS, type TaskName } from "./tasks";

// The one place the UI goes to talk to a model. Both Claude and local models
// are called straight from the browser; nothing goes through our server.

export async function testConnection(settings: ModelSettings): Promise<TestConnectionResult> {
  try {
    const models = PROVIDERS[settings.provider].isLocal
      ? await listLocalModels(settings)
      : await listClaudeModels(settings);
    return {
      ok: true,
      message: `Connected! Found ${models.length} model${models.length === 1 ? "" : "s"}.`,
      models,
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof FriendlyError ? error.message : "Something unexpected went wrong.",
      models: [],
    };
  }
}

/** Runs a task on whichever model the person picked. Throws FriendlyError on failure. */
export async function runTask<Output>(
  settings: ModelSettings,
  name: TaskName,
  input: unknown,
): Promise<Output> {
  const task = TASKS[name];
  const checked = task.input.safeParse(input);
  if (!checked.success) throw new FriendlyError(checked.error.issues[0].message);

  if (PROVIDERS[settings.provider].isLocal) {
    return runLocalTask(settings, task, checked.data);
  }
  return runClaudeTask(settings, task, checked.data);
}
