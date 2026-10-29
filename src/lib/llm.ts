import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { PROVIDERS, type ModelSettings, type ProviderId, type TaskWeight } from "./providers";

/**
 * An error whose message is safe and helpful to show directly to a
 * non-technical user.
 */
export class FriendlyError extends Error {}

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
    return new FriendlyError(
      "Couldn't reach Claude's servers. Check your internet connection.",
    );
  }
  if (error instanceof Anthropic.APIError) {
    return new FriendlyError(`Claude returned an error (${error.status}): ${error.message}`);
  }
  return new FriendlyError("Something went wrong talking to Claude. Try again in a moment.");
}

function localHelp(provider: ProviderId): string {
  return provider === "lmstudio"
    ? "Make sure LM Studio is open, then go to the Developer tab and switch the server on (Status: Running)."
    : "Make sure Ollama is running. Opening the Ollama app is enough, or run `ollama serve` in a terminal.";
}

function noModelsHelp(provider: ProviderId): string {
  return provider === "lmstudio"
    ? "LM Studio is running, but no models are downloaded yet. Use the Discover tab in LM Studio to download one (see the setup guide for a recommendation)."
    : "Ollama is running, but no models are downloaded yet. Open a terminal and run `ollama pull qwen3:8b` (see the setup guide for other options).";
}

async function localFetch(settings: ModelSettings, path: string, init?: RequestInit) {
  const label = PROVIDERS[settings.provider].label.replace(/ \(.*\)$/, "");
  const baseUrl = settings.baseUrl.trim().replace(/\/+$/, "");
  if (!/^https?:\/\//.test(baseUrl)) {
    throw new FriendlyError(
      `The server address should start with http://, for example ${PROVIDERS[settings.provider].defaultBaseUrl}`,
    );
  }

  let res: Response;
  try {
    res = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
  } catch {
    throw new FriendlyError(
      `Couldn't reach ${label} at ${baseUrl}. ${localHelp(settings.provider)}`,
    );
  }

  if (res.status === 404) {
    throw new FriendlyError(
      `${label} answered, but not at that address. Check that the server address ends in /v1, for example ${PROVIDERS[settings.provider].defaultBaseUrl}`,
    );
  }
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new FriendlyError(`${label} returned an error (${res.status}). ${body.slice(0, 300)}`);
  }
  return res.json();
}

/** Lists the models this provider can use. Throws FriendlyError on failure. */
export async function listModels(settings: ModelSettings): Promise<string[]> {
  if (settings.provider === "claude") {
    try {
      const client = claudeClient(settings);
      const ids: string[] = [];
      for await (const model of client.models.list()) ids.push(model.id);
      return ids;
    } catch (error) {
      throw claudeError(error);
    }
  }

  const data = (await localFetch(settings, "/models")) as { data?: { id: string }[] };
  const ids = (data.data ?? [])
    .map((m) => m.id)
    // LM Studio also lists embedding models, which can't chat.
    .filter((id) => !/embed/i.test(id));
  if (ids.length === 0) throw new FriendlyError(noModelsHelp(settings.provider));
  return ids;
}

/** Pulls the JSON object out of a local model's reply, which may wrap it in prose. */
function extractJson(text: string): unknown {
  // Some local reasoning models include their thinking inline.
  const cleaned = text.replace(/<think>[\s\S]*?<\/think>/g, "");
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    return null;
  }
}

/**
 * Picks the model for a task. With Claude, only heavy tasks use the main
 * (Opus) model; light ones use the cheaper quick model. Local providers have
 * one model for everything.
 */
function modelFor(settings: ModelSettings, weight: TaskWeight): string {
  if (settings.provider === "claude" && weight === "light") {
    return settings.quickModel.trim() || settings.model.trim();
  }
  return settings.model.trim();
}

/**
 * Sends one system prompt and one user message, and returns the reply parsed
 * against `schema`. This is the single entry point the resume features use,
 * so they work the same way with Claude and with local models.
 */
export async function complete<T>(
  settings: ModelSettings,
  weight: TaskWeight,
  system: string,
  user: string,
  schema: z.ZodType<T>,
): Promise<T> {
  const model = modelFor(settings, weight);
  if (!model) {
    throw new FriendlyError("Pick a model in Model settings first.");
  }

  if (settings.provider === "claude") {
    try {
      const client = claudeClient(settings);
      const message = await client.messages.parse({
        model,
        max_tokens: 16000,
        thinking: { type: "adaptive" },
        output_config: { effort: "medium", format: zodOutputFormat(schema) },
        system,
        messages: [{ role: "user", content: user }],
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

  const data = (await localFetch(settings, "/chat/completions", {
    method: "POST",
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content: `${system}\n\nReply with only a JSON object matching this schema:\n${JSON.stringify(z.toJSONSchema(schema))}`,
        },
        { role: "user", content: user },
      ],
      // Both LM Studio and Ollama use this to constrain the reply to the schema.
      response_format: {
        type: "json_schema",
        json_schema: { name: "result", strict: true, schema: z.toJSONSchema(schema) },
      },
    }),
  })) as { choices?: { message?: { content?: string } }[] };
  const parsed = schema.safeParse(extractJson(data.choices?.[0]?.message?.content ?? ""));
  if (!parsed.success) {
    throw new FriendlyError(
      "The local model's answer wasn't in the format Job Helper expected. Try again, or try a bigger model.",
    );
  }
  return parsed.data;
}
