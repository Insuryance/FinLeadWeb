/**
 * Where the /try page gets its data.
 *
 * Two sources, one interface:
 *
 *   static  (default)  pre-generated JSON under /demo, served by the CDN. No backend, no database,
 *                      nothing to deploy or keep alive. This is what the public site uses.
 *   api                the live proxy at /api/grid-trial, for developing against a running backend
 *                      or warming a new sample.
 *
 * Static is the default rather than the fallback on purpose. The page shows two extractions that
 * cannot change — live runs are off by design — so making it depend on a reachable service bought
 * nothing and cost an outage every time a long-lived process degraded.
 *
 * Choose with NEXT_PUBLIC_GRID_DEMO_SOURCE=api. Anything else, including unset, means static.
 */

const API_BASE = "/api/grid-trial";
const STATIC_BASE = "/demo";

export const source =
  process.env.NEXT_PUBLIC_GRID_DEMO_SOURCE === "api" ? "api" : "static";

async function getJson(url, options) {
  const res = await fetch(url, options);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`);
  return body;
}

export async function loadSamples() {
  if (source === "api") return getJson(`${API_BASE}/samples`);
  return getJson(`${STATIC_BASE}/samples.json`);
}

export async function loadPreview(sampleId) {
  if (source === "api") {
    return getJson(`${API_BASE}/samples/${encodeURIComponent(sampleId)}/preview`);
  }
  return getJson(`${STATIC_BASE}/${encodeURIComponent(sampleId)}.preview.json`);
}

/**
 * The completed run for a sample.
 *
 * The api path keeps the two-step shape the backend exposes — POST to get a run id, then GET it —
 * because that is what a real extraction needs. Statically there is one file and no run to start,
 * which is also why the demo cannot be made to trigger model spend from the browser.
 */
export async function loadRun(sampleId) {
  if (source === "api") {
    const started = await getJson(`${API_BASE}/runs`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sampleId }),
    });
    const full = await getJson(`${API_BASE}/runs/${started.runId}`);
    return { run: full, cached: Boolean(started.cached), extractedAt: started.extractedAt ?? null };
  }
  const run = await getJson(`${STATIC_BASE}/${encodeURIComponent(sampleId)}.run.json`);
  return { run, cached: true, extractedAt: run.extractedAt ?? null };
}
