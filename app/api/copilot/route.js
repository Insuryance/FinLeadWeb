// Serverless function that powers the embedded copilot.
// The API key lives ONLY here (server-side) and is never exposed to the browser.
export const runtime = "nodejs";

const SYSTEM_PROMPT = `You are the FinLead AI Copilot, an assistant for an insurance-operations AI company.
SCOPE RULE — you ONLY answer questions about insurance and insurance operations: policies, claims, underwriting, premiums, commissions, reconciliation, payouts, actuarial concepts, IRDAI/insurance regulation, distribution channels, insurer back-office workflows, and related topics.
If a question is NOT about insurance, politely and briefly decline in one sentence and invite an insurance question instead. Do not answer off-topic questions even partially.
Style: concise, professional, executive tone. 2-4 sentences unless asked for detail. No markdown headers.`;

// Current model (May 2026). For lower cost/faster replies use "claude-haiku-4-5".
// For maximum quality use "claude-opus-4-8".
const MODEL = "claude-sonnet-4-6";

export async function POST(req) {
  try {
    const { messages } = await req.json();
    if (!Array.isArray(messages) || messages.length === 0) {
      return Response.json({ error: "No messages provided." }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return Response.json(
        { error: "Server is missing ANTHROPIC_API_KEY. Set it in your environment variables." },
        { status: 500 }
      );
    }

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages: messages.slice(-12).map((m) => ({
          role: m.role === "assistant" ? "assistant" : "user",
          content: String(m.content || "").slice(0, 4000),
        })),
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return Response.json(
        { error: data?.error?.message || "Upstream API error." },
        { status: 502 }
      );
    }

    const reply = (data.content || [])
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

    return Response.json({ reply: reply || "Sorry — I couldn't generate a response. Please try again." });
  } catch (e) {
    return Response.json({ error: "Server error. Please try again." }, { status: 500 });
  }
}
