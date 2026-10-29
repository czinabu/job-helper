import { NextResponse } from "next/server";
import { FriendlyError, complete } from "@/lib/llm";
import type { ModelSettings } from "@/lib/providers";
import {
  TAILOR_SYSTEM_PROMPT,
  TailorRequestSchema,
  TailorResultSchema,
  tailorUserPrompt,
} from "@/lib/tailor";

// Local models on modest hardware can take several minutes.
export const maxDuration = 300;

export async function POST(request: Request) {
  const body = (await request.json()) as { settings: ModelSettings; inputs: unknown };
  const inputs = TailorRequestSchema.safeParse(body.inputs);
  if (!inputs.success) {
    return NextResponse.json({ error: inputs.error.issues[0].message }, { status: 400 });
  }

  try {
    const result = await complete(
      body.settings,
      // Rewriting a whole resume is the app's most demanding task.
      "heavy",
      TAILOR_SYSTEM_PROMPT,
      tailorUserPrompt(inputs.data),
      TailorResultSchema,
    );
    return NextResponse.json({ result });
  } catch (error) {
    const message =
      error instanceof FriendlyError ? error.message : "Something unexpected went wrong.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
