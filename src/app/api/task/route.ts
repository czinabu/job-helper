import { NextResponse } from "next/server";
import { runClaudeTask } from "@/lib/claude";
import { friendlyMessage } from "@/lib/errors";
import type { ModelSettings } from "@/lib/providers";
import { TASKS } from "@/lib/tasks";

// Big Claude requests (like rewriting a whole resume) can take a while.
export const maxDuration = 300;

// Runs a task on Claude. Local models are called from the browser instead.
export async function POST(request: Request) {
  const body = (await request.json()) as { settings: ModelSettings; task: string; input: unknown };
  const task = Object.hasOwn(TASKS, body.task) ? TASKS[body.task] : undefined;
  if (!task) {
    return NextResponse.json({ error: "Unknown task." }, { status: 400 });
  }
  if (body.settings?.provider !== "claude") {
    return NextResponse.json(
      { error: "Local models run in your browser, not on the server." },
      { status: 400 },
    );
  }
  const input = task.input.safeParse(body.input);
  if (!input.success) {
    return NextResponse.json({ error: input.error.issues[0].message }, { status: 400 });
  }

  try {
    const result = await runClaudeTask(body.settings, task, input.data);
    return NextResponse.json({ result });
  } catch (error) {
    return NextResponse.json({ error: friendlyMessage(error) }, { status: 502 });
  }
}
