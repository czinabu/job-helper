import { NextResponse } from "next/server";
import { listClaudeModels } from "@/lib/claude";
import { friendlyMessage } from "@/lib/errors";
import type { ModelSettings, TestConnectionResult } from "@/lib/providers";

// Checks a Claude API key. Local models are tested from the browser instead.
export async function POST(request: Request) {
  const settings = (await request.json()) as ModelSettings;
  let result: TestConnectionResult;
  try {
    const models = await listClaudeModels(settings);
    result = {
      ok: true,
      message: `Connected! Found ${models.length} model${models.length === 1 ? "" : "s"}.`,
      models,
    };
  } catch (error) {
    result = { ok: false, message: friendlyMessage(error), models: [] };
  }
  return NextResponse.json(result);
}
