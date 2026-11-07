import { NextResponse } from "next/server";
import { ask, ClaudeLLM } from "@/lib/answer";
import { OpenAIEmbedder } from "@/lib/embed";
import { SupabaseStore } from "@/lib/supabase-store";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { question?: unknown } | null;
  const question = typeof body?.question === "string" ? body.question.trim() : "";
  if (question.length < 3 || question.length > 500) {
    return NextResponse.json({ error: "question must be 3 to 500 characters" }, { status: 400 });
  }

  const { ANTHROPIC_API_KEY, OPENAI_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, MIN_SCORE } = process.env;
  const minScore = MIN_SCORE ? Number(MIN_SCORE) : Number.NaN;
  if (!ANTHROPIC_API_KEY || !OPENAI_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !Number.isFinite(minScore)) {
    return NextResponse.json({ error: "server is not configured" }, { status: 500 });
  }

  const result = await ask(question, {
    embedder: new OpenAIEmbedder(OPENAI_API_KEY),
    store: new SupabaseStore(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY),
    llm: new ClaudeLLM(ANTHROPIC_API_KEY),
    minScore,
  });
  return NextResponse.json(result);
}
