export type AiSuggestion = {
  meaningVi: string[];
  exampleEn: string;
  exampleVi: string;
  mnemonic: string;
};

const PROMPT = (word: string): string =>
  `You help Vietnamese learners of English. For the English word or phrase "${word}", reply with ONLY a JSON object (no markdown): {"meaningVi": ["nghĩa 1", "nghĩa 2"], "exampleEn": "one natural example sentence", "exampleVi": "bản dịch tiếng Việt của câu ví dụ", "mnemonic": "a short memory trick"}. Keep meanings concise.`;

export function parseSuggestion(text: string): AiSuggestion | null {
  try {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start < 0 || end <= start) return null;
    const j = JSON.parse(text.slice(start, end + 1)) as Partial<AiSuggestion>;
    if (!Array.isArray(j.meaningVi) || j.meaningVi.length === 0) return null;
    return {
      meaningVi: j.meaningVi.filter((x) => typeof x === "string").slice(0, 4).map(String),
      exampleEn: typeof j.exampleEn === "string" ? j.exampleEn.slice(0, 500) : "",
      exampleVi: typeof j.exampleVi === "string" ? j.exampleVi.slice(0, 500) : "",
      mnemonic: typeof j.mnemonic === "string" ? j.mnemonic.slice(0, 500) : "",
    };
  } catch {
    return null;
  }
}

async function withTimeout(ms: number, signal?: AbortSignal): Promise<AbortSignal> {
  const ctrl = new AbortController();
  const t = window.setTimeout(() => ctrl.abort(new Error("AI trả lời quá lâu (timeout).")), ms);
  signal?.addEventListener("abort", () => {
    window.clearTimeout(t);
    ctrl.abort(signal.reason);
  });
  window.setTimeout(() => window.clearTimeout(t), ms + 100);
  return ctrl.signal;
}

/** Gemini (miễn phí tier): POST trực tiếp từ trình duyệt. */
export async function suggestWithGemini(apiKey: string, word: string, signal?: AbortSignal): Promise<AiSuggestion> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: PROMPT(word) }] }] }),
      signal: await withTimeout(25000, signal),
    },
  );
  if (!res.ok) throw new Error(`Gemini lỗi HTTP ${res.status} — kiểm tra key.`);
  const json = (await res.json()) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
  const text = json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  const out = parseSuggestion(text);
  if (!out) throw new Error("AI trả về không đúng định dạng — thử lại.");
  return out;
}

/** OpenAI-compatible (OpenAI, OpenRouter…): cần endpoint cho phép CORS. */
export async function suggestWithOpenAI(baseUrl: string, apiKey: string, model: string, word: string, signal?: AbortSignal): Promise<AiSuggestion> {
  const base = baseUrl.replace(/\/$/, "");
  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: PROMPT(word) }],
      temperature: 0.3,
    }),
    signal: await withTimeout(25000, signal),
  });
  if (!res.ok) throw new Error(`API lỗi HTTP ${res.status} — kiểm tra key/model/CORS.`);
  const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const text = json.choices?.[0]?.message?.content ?? "";
  const out = parseSuggestion(text);
  if (!out) throw new Error("AI trả về không đúng định dạng — thử lại.");
  return out;
}
