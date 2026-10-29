import { z } from "zod";
import { FriendlyError } from "./errors";
import { PROVIDERS, type ModelSettings } from "./providers";
import type { Task } from "./tasks";

// LM Studio and Ollama run on the visitor's own computer, so the browser
// talks to them directly. This is what lets the hosted site use local models,
// and it means resumes never pass through our server in local mode.

function label(settings: ModelSettings) {
  return settings.provider === "lmstudio" ? "LM Studio" : "Ollama";
}

function unreachableHelp(settings: ModelSettings): string {
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const steps =
    settings.provider === "lmstudio"
      ? [
          "LM Studio is open, and its Developer tab says the server is Running.",
          'In the Developer tab\'s Server Settings, "Enable CORS" is switched on.',
        ]
      : [
          "Ollama is running (opening the Ollama app is enough).",
          `OLLAMA_ORIGINS is set to ${origin || "this site's address"}, and you restarted Ollama after setting it.`,
        ];
  steps.push(
    "If your browser asked to access devices on your local network, you clicked Allow.",
  );
  if (origin.startsWith("https:")) {
    steps.push("You're using Chrome, Edge, or Firefox. Safari may block local models.");
  }
  return `Check that:\n${steps.map((s) => `• ${s}`).join("\n")}`;
}

/** Shown when the server answered but the browser hid the answer, which means CORS is off. */
function blockedHelp(settings: ModelSettings): string {
  if (settings.provider === "lmstudio") {
    return 'LM Studio is running, but it isn\'t letting this website in. In LM Studio, open the Developer tab, click Server Settings, and switch on "Enable CORS". Then click Test connection again.';
  }
  const origin = typeof window === "undefined" ? "this site's address" : window.location.origin;
  return `Ollama is running, but it isn't letting this website in. Set OLLAMA_ORIGINS to ${origin}, quit Ollama, and open it again. The setup guide shows how.`;
}

/**
 * A no-cors request can't read the reply, but it succeeds whenever the server
 * answers at all. So if it succeeds after a normal request failed, the server
 * is up and CORS is what's blocking us.
 */
async function serverAnswers(url: string): Promise<boolean> {
  try {
    await fetch(url, { mode: "no-cors" });
    return true;
  } catch {
    return false;
  }
}

async function localFetch(settings: ModelSettings, path: string, init?: RequestInit) {
  const baseUrl = settings.baseUrl.trim().replace(/\/+$/, "");
  if (!/^https?:\/\//.test(baseUrl)) {
    throw new FriendlyError(
      `The server address should start with http://, for example ${PROVIDERS[settings.provider].defaultBaseUrl}`,
    );
  }

  const url = `${baseUrl}${path}`;
  let res: Response;
  try {
    // Only send Content-Type with a body. On a plain GET it would make the
    // browser send an extra preflight request for no reason.
    res = await fetch(url, {
      ...init,
      headers: init?.body ? { "Content-Type": "application/json", ...init.headers } : init?.headers,
    });
  } catch {
    if (await serverAnswers(url)) throw new FriendlyError(blockedHelp(settings));
    throw new FriendlyError(
      `Couldn't reach ${label(settings)} at ${baseUrl}. ${unreachableHelp(settings)}`,
    );
  }

  if (res.status === 404) {
    throw new FriendlyError(
      `${label(settings)} answered, but not at that address. Check that the server address ends in /v1, for example ${PROVIDERS[settings.provider].defaultBaseUrl}`,
    );
  }
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new FriendlyError(
      `${label(settings)} returned an error (${res.status}). ${body.slice(0, 300)}`,
    );
  }
  return res.json();
}

export async function listLocalModels(settings: ModelSettings): Promise<string[]> {
  const data = (await localFetch(settings, "/models")) as { data?: { id: string }[] };
  const ids = (data.data ?? [])
    .map((m) => m.id)
    // LM Studio also lists embedding models, which can't chat.
    .filter((id) => !/embed/i.test(id));
  if (ids.length === 0) {
    throw new FriendlyError(
      settings.provider === "lmstudio"
        ? "LM Studio is running, but no models are downloaded yet. Use the Discover tab in LM Studio to download one (Model settings suggests one for your computer)."
        : "Ollama is running, but no models are downloaded yet. Open a terminal and run `ollama pull gemma4:12b`, or see Model settings for the right model for your computer.",
    );
  }
  return ids;
}

/** Pulls the JSON object out of a local model's reply, which may wrap it in prose. */
export function extractJson(text: string): unknown {
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

export async function runLocalTask<Input, Output>(
  settings: ModelSettings,
  task: Task<Input, Output>,
  input: Input,
): Promise<Output> {
  // Local providers use one model for every task, whatever its weight.
  if (!settings.model.trim()) throw new FriendlyError("Pick a model in Model settings first.");

  const schema = z.toJSONSchema(task.output);
  const data = (await localFetch(settings, "/chat/completions", {
    method: "POST",
    body: JSON.stringify({
      model: settings.model.trim(),
      messages: [
        {
          role: "system",
          content: `${task.system}\n\nReply with only a JSON object matching this schema:\n${JSON.stringify(schema)}`,
        },
        { role: "user", content: task.user(input) },
      ],
      // Both LM Studio and Ollama use this to constrain the reply to the schema.
      response_format: { type: "json_schema", json_schema: { name: "result", strict: true, schema } },
    }),
  })) as { choices?: { message?: { content?: string } }[] };

  const parsed = task.output.safeParse(extractJson(data.choices?.[0]?.message?.content ?? ""));
  if (!parsed.success) {
    throw new FriendlyError(
      "The local model's answer wasn't in the format Job Helper expected. Try again, or try a bigger model.",
    );
  }
  return parsed.data;
}
