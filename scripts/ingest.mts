import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { chunkEmbeddingText, chunkMarkdown } from "../src/lib/chunk";
import { OpenAIEmbedder } from "../src/lib/embed";
import { SupabaseStore } from "../src/lib/supabase-store";

const dir = process.argv[2] ?? "evals/corpus";
const { OPENAI_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
if (!OPENAI_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Set OPENAI_API_KEY, SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
}

const files = (await readdir(dir)).filter((f) => f.endsWith(".md"));
const chunks = (
  await Promise.all(files.map(async (f) => chunkMarkdown(f, await readFile(path.join(dir, f), "utf8"))))
).flat();

const embeddings = await new OpenAIEmbedder(OPENAI_API_KEY).embed(chunks.map(chunkEmbeddingText));
await new SupabaseStore(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY).upsert(chunks, embeddings);
console.log(`Ingested ${chunks.length} chunks from ${files.length} files.`);
