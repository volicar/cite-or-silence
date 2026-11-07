"use client";

import { useState } from "react";
import type { AskResult } from "@/lib/types";

export default function Page() {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<AskResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    setResult(null);
    const response = await fetch("/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });
    setResult(response.ok ? ((await response.json()) as AskResult) : null);
    setLoading(false);
  }

  return (
    <main>
      <h1>cite-or-silence</h1>
      <p>Ask a question. You get an answer with citations, or an honest refusal.</p>
      <input
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="e.g. How do I rotate an API key?"
        style={{ width: "100%", padding: 8 }}
      />
      <button onClick={submit} disabled={loading || question.trim().length < 3} style={{ marginTop: 8 }}>
        {loading ? "Thinking..." : "Ask"}
      </button>
      {result?.kind === "answer" && (
        <section>
          <p>{result.text}</p>
          <ul>
            {result.citations.map((c) => (
              <li key={c.chunkId}>
                [{c.n}] {c.source} &rsaquo; {c.heading}
              </li>
            ))}
          </ul>
        </section>
      )}
      {result?.kind === "abstain" && <p><em>No reliable answer in the documentation ({result.reason}).</em></p>}
    </main>
  );
}
