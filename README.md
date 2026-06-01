# FinLead AI — Website

Premium B2B landing page for FinLead AI with an embedded, insurance-only AI copilot.
Built with Next.js (App Router). The copilot runs server-side so your API key is never exposed.

## What's inside
- `app/page.jsx` — the landing page (hero, product console mockup, agent use-cases, copilot, footer)
- `app/api/copilot/route.js` — secure serverless function that talks to the Anthropic API
- `app/globals.css` — fonts, colours, and all styling

---

## Run it on your computer (optional, to preview locally)
1. Install Node.js 18+ from https://nodejs.org
2. In this folder, run: `npm install`
3. Copy `.env.example` to `.env.local` and paste your real Anthropic key
4. Run `npm run dev`, then open http://localhost:3000

---

## Deploy it live on finlead.ai (the real goal)

### Step 1 — Put the code on GitHub
- Create a new repository at https://github.com/new (e.g. `finlead-site`)
- Upload this whole folder to it (drag-and-drop in the browser works, or let Cowork/Claude Code push it)

### Step 2 — Deploy on Vercel
- Go to https://vercel.com and sign in **with GitHub**
- Click **Add New → Project**, pick the `finlead-site` repo, click **Import**
- Before deploying, open **Environment Variables** and add:
  - Name: `ANTHROPIC_API_KEY`
  - Value: your key from https://console.anthropic.com
- Click **Deploy**. In ~60 seconds you get a live `*.vercel.app` URL.

### Step 3 — Connect your domain
- In the Vercel project: **Settings → Domains → Add** → type `finlead.ai`
- Vercel shows you 1–2 DNS records
- Log in to your domain registrar, open DNS settings, and add those records
- Wait a few minutes (up to ~1 hour). finlead.ai is now live.

Every future `git push` auto-redeploys. No servers to manage.

---

## Model
The copilot uses `claude-sonnet-4-6`. To change cost/quality, edit `MODEL` in
`app/api/copilot/route.js`:
- `claude-haiku-4-5` — cheapest & fastest
- `claude-sonnet-4-6` — balanced (default)
- `claude-opus-4-8` — highest quality
