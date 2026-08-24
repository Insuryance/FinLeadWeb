// Server-side proxy to the FinLead grid-trial API.
//
// Why a proxy instead of calling the backend from the browser:
//   - The browser only ever talks to this origin, so CORS is not involved at all.
//   - The backend's address stays server-side, exactly like ANTHROPIC_API_KEY in
//     app/api/copilot/route.js. Changing where the backend lives is an env var change.
//   - It gives one place to add caching, rate limiting or auth later without touching the page.
//
// Configure with FINLEAD_GRID_API (see .env.example). Paths map straight through:
//   /api/grid-trial/samples                  -> {FINLEAD_GRID_API}/samples
//   /api/grid-trial/samples/{id}/preview     -> {FINLEAD_GRID_API}/samples/{id}/preview
//   /api/grid-trial/runs                     -> {FINLEAD_GRID_API}/runs
//   /api/grid-trial/runs/{runId}             -> {FINLEAD_GRID_API}/runs/{runId}
export const runtime = "nodejs";

// A completed run's payload is large — the 21-sheet workbook returns ~6.5 MB, almost all of it the
// 4,705 extracted rules. The backend serves that in well under a second locally, but the transfer
// itself needs headroom on a slow link, and a backend whose database pool has stalled takes its own
// 30s to fail. A 30s budget here raced both and surfaced as "did not respond in time" for problems
// that were not timeouts. This guards genuinely stuck calls, so it is generous on purpose.
const UPSTREAM_TIMEOUT_MS = 120_000;

function upstreamBase() {
  const base = process.env.FINLEAD_GRID_API;
  if (!base) return null;
  return base.replace(/\/+$/, "");
}

function missingConfig() {
  return Response.json(
    { error: "Server is missing FINLEAD_GRID_API. Set it in your environment variables." },
    { status: 500 },
  );
}

async function forward(req, params, method) {
  const base = upstreamBase();
  if (!base) return missingConfig();

  const path = (params?.path || []).join("/");
  const search = new URL(req.url).search;
  const target = `${base}/${path}${search}`;

  const init = {
    method,
    headers: { "content-type": "application/json" },
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
  };
  if (method === "POST") {
    init.body = await req.text();
  }

  try {
    const upstream = await fetch(target, init);
    const contentType = upstream.headers.get("content-type") || "application/json";

    // Binary responses (the original .xlsx download) must pass through as bytes; reading them as
    // text would corrupt the file.
    if (!contentType.includes("json")) {
      const headers = { "content-type": contentType };
      for (const header of ["content-disposition", "content-length"]) {
        const value = upstream.headers.get(header);
        if (value) headers[header] = value;
      }
      return new Response(await upstream.arrayBuffer(), { status: upstream.status, headers });
    }

    const text = await upstream.text();
    // Pass the upstream status through so the page can distinguish 404 from 422 from 500.
    return new Response(text, {
      status: upstream.status,
      headers: { "content-type": contentType },
    });
  } catch (e) {
    const timedOut = e?.name === "TimeoutError";
    return Response.json(
      {
        error: timedOut
          ? "The extraction service did not respond in time."
          : "Could not reach the extraction service.",
      },
      { status: 504 },
    );
  }
}

export async function GET(req, { params }) {
  return forward(req, params, "GET");
}

export async function POST(req, { params }) {
  return forward(req, params, "POST");
}
