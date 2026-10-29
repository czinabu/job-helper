import { NextResponse } from "next/server";
import { FriendlyError, listModels } from "@/lib/llm";
import type { ModelSettings, TestConnectionResult } from "@/lib/providers";

export async function POST(request: Request) {
  const settings = (await request.json()) as ModelSettings;
  let result: TestConnectionResult;
  try {
    const models = await listModels(settings);
    result = {
      ok: true,
      message: `Connected! Found ${models.length} model${models.length === 1 ? "" : "s"}.`,
      models,
    };
  } catch (error) {
    result = {
      ok: false,
      message:
        error instanceof FriendlyError ? error.message : "Something unexpected went wrong.",
      models: [],
    };
  }
  return NextResponse.json(result);
}
