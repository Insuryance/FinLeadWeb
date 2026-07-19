// Serverless function that powers the embedded assistant.
// The API key lives ONLY here (server-side) and is never exposed to the browser.
export const runtime = "nodejs";

const SYSTEM_PROMPT = `You are the FinLead AI assistant, embedded on FinLead AI's website.

ABOUT FINLEAD AI (your only knowledge scope):
- FinLead AI is an AI-native platform that deploys AI agents to run insurance operations for insurers, brokers, agencies, MGAs and other distributors — handling complex back-office tasks with intelligence, speed and accuracy.
- Positioning: "We don't sell seats. We own the outcome." Pricing is tied to the work displaced (BPO economics) while delivering software margins. Agents complete work autonomously rather than just assisting.
- Three agent suites:
  1) Finance Ops — Commission Reconciliation (match carrier statements, flag tax/rate mismatches, reconcile precisely), Statement & Policy Extraction (turn unstructured carrier PDFs/portals into clean queryable data), Payout Calculation (compute payouts against rules and cycles with a full audit trail).
  2) 2) Producers & Distribution — Agent Onboarding (verification, licensing checks, activation), Agent Analysis (performance, persistency, productivity), Agent Intelligence (who to coach/reward, where next premium comes from).
  3) Intelligence — Leakage Analysis (detect leakage across commissions, payouts, claims), Profitability Guardrails (measure every payout against profit), Corrective Insight (recommend changes to rates, rules and controls to recover margin).
- Built for insurers, brokers, MGAs and more, globally. Backed by Entrepreneur First and Transpose.

RULES:
- ONLY answer questions about FinLead AI — what it does, who it serves, the agent suites, the business model, and how to engage (e.g. booking a demo).
- If asked anything outside FinLead AI (general knowledge, other companies, unrelated topics), politely decline in one sentence and invite a FinLead AI question instead.
- Do NOT invent specifics you weren't given (exact pricing, named customers, headcount, funding amounts). If asked, say that's best covered in a demo and offer to point them there.
- Style: concise, professional, executive tone. 2-4 sentences unless more detail is requested. No markdown headers.`;

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
      return Response.json({ error: "Server is missing ANTHROPIC_API_KEY. Set it in your environment variables." }, { status: 500 });
    }
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
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
      return Response.json({ error: data?.error?.message || "Upstream API error." }, { status: 502 });
    }
    const reply = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
    return Response.json({ reply: reply || "Sorry — I couldn't generate a response. Please try again." });
  } catch (e) {
    return Response.json({ error: "Server error. Please try again." }, { status: 500 });
  }
}
