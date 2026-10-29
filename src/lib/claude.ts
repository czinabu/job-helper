import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { FriendlyError } from "./errors";
import type { ModelSettings, TaskWeight } from "./providers";
import type { Task } from "./tasks";

// Claude runs on the server so API keys stay out of the browser when the
// site owner provides one. Local models never come through here.

function claudeClient(settings: ModelSettings) {
  const apiKey = settings.apiKey.trim() || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new FriendlyError(
      "No Claude API key found. Paste your key from console.anthropic.com into the API key box.",
    );
  }
  return new Anthropic({ apiKey });
}

function claudeError(error: unknown): FriendlyError {
  if (error instanceof FriendlyError) return error;
  if (error instanceof Anthropic.AuthenticationError) {
    return new FriendlyError(
      "Claude rejected the API key. Check that you copied the whole key from console.anthropic.com.",
    );
  }
  if (error instanceof Anthropic.PermissionDeniedError) {
    return new FriendlyError(
      "This API key isn't allowed to use that model. Check your Anthropic account's plan and billing.",
    );
  }
  if (error instanceof Anthropic.NotFoundError) {
    return new FriendlyError(
      "Claude doesn't recognize that model name. Pick one from the list after testing the connection.",
    );
  }
  if (error instanceof Anthropic.RateLimitError) {
    return new FriendlyError(
      "Claude is rate limiting this key right now. Wait a minute and try again.",
    );
  }
  if (error instanceof Anthropic.APIConnectionError) {
    return new FriendlyError("Couldn't reach Claude's servers. Check your internet connection.");
  }
  if (error instanceof Anthropic.APIError) {
    return new FriendlyError(`Claude returned an error (${error.status}): ${error.message}`);
  }
  return new FriendlyError("Something went wrong talking to Claude. Try again in a moment.");
}

export async function listClaudeModels(settings: ModelSettings): Promise<string[]> {
  try {
    const client = claudeClient(settings);
    const ids: string[] = [];
    for await (const model of client.models.list()) ids.push(model.id);
    return ids;
  } catch (error) {
    throw claudeError(error);
  }
}

/** Only heavy tasks use the main (Opus) model; light ones use the cheaper quick model. */
function modelFor(settings: ModelSettings, weight: TaskWeight): string {
  if (weight === "light") return settings.quickModel.trim() || settings.model.trim();
  return settings.model.trim();
}

export async function runClaudeTask<Input, Output>(
  settings: ModelSettings,
  task: Task<Input, Output>,
  input: Input,
): Promise<Output> {
  const model = modelFor(settings, task.weight);
  if (!model) throw new FriendlyError("Pick a model in Model settings first.");

  try {
    const client = claudeClient(settings);
    const message = await client.messages.parse({
      model,
      max_tokens: 16000,
      thinking: { type: "adaptive" },
      output_config: { effort: "medium", format: zodOutputFormat(task.output) },
      system: task.system,
      messages: [{ role: "user", content: task.user(input) }],
    });
    if (message.stop_reason === "refusal") {
      throw new FriendlyError("Claude declined this request. Try rewording it.");
    }
    if (message.stop_reason === "max_tokens" || !message.parsed_output) {
      throw new FriendlyError("Claude's answer was cut off. Try a shorter resume or job posting.");
    }
    return message.parsed_output;
  } catch (error) {
    throw claudeError(error);
  }
}
