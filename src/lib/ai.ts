"use client";

import { FriendlyError } from "./errors";
import { listLocalModels, runLocalTask } from "./local";
import { PROVIDERS, type ModelSettings, type TestConnectionResult } from "./providers";
import { TASKS, type TaskName } from "./tasks";

// The one place the UI goes to talk to a model. Local models are called
// straight from the browser; Claude goes through our server.

async function postJson<T>(url: string, body: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new FriendlyError("Couldn't reach Job Helper. Check your internet connection.");
  }
  const data = await res.json().catch(() => null);
  if (!res.ok || !data) {
    throw new FriendlyError(data?.error ?? "Job Helper's server had a problem. Try again.");
  }
  return data as T;
}

export async function testConnection(settings: ModelSettings): Promise<TestConnectionResult> {
  if (!PROVIDERS[settings.provider].isLocal) {
    return postJson<TestConnectionResult>("/api/test-connection", settings).catch((error) => ({
      ok: false,
      message: error instanceof FriendlyError ? error.message : String(error),
      models: [],
    }));
  }
  try {
    const models = await listLocalModels(settings);
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
  const { result } = await postJson<{ result: Output }>("/api/task", {
    settings,
    task: name,
    input: checked.data,
  });
  return result;
}
