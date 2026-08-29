# OceanGuard marine insurer portal

This directory is the canonical source for the static OceanGuard portal used by the Marine COI Automation Solution Lab.

It is built with plain HTML, CSS, and JavaScript. Vite copies everything under `public` directly into the production build, so the portal ships with the main FinLead frontend and requires no separate deployment, copy step, or environment variable.

## Application routes

- Embedded workflow: `/labs/marine-coi-automation`
- Protected standalone view: `/labs/marine-coi-portal`
- Static document used by the protected views: `/marine-insurer-portal/index.html`

Direct top-level access to the static document redirects to the protected standalone route. The existing FinLead `_protected` layout sends signed-out users to `/login` and returns them to the portal after authentication.

## Message contract

Parent to portal:

- `LOAD_SHIPMENT` with the extracted shipment payload
- `START_AUTOMATION`
- `APPROVE_SUBMISSION`
- `RESET_PORTAL`

Portal to parent:

- `PORTAL_READY`
- `AUTOMATION_EVENT`
- `REVIEW_REQUIRED`
- `AUTOMATION_COMPLETE`
- `PORTAL_ERROR`

Messages use `source: "finlead-solutions-lab"` or `source: "oceanguard-portal"` so unrelated window messages are ignored.
