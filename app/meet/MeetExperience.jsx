"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Calculator,
  CheckCircle2,
  ClipboardCheck,
  Mail,
  MessageSquareText,
  ScanLine,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

const FOUNDER_EMAIL = "surya@finleadai.com";

function trackMeetEvent(eventName, params = {}) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;

  window.gtag("event", eventName, {
    page_location: window.location.href,
    page_path: window.location.pathname,
    qr_destination: "meet",
    ...params,
  });
}

const workflows = [
  {
    id: "reconcile",
    icon: Calculator,
    label: "Commission reconciliation",
    question: "How many carrier statements do you reconcile each month?",
    unit: "statements",
    min: 20,
    max: 900,
    defaultValue: 180,
    line: "FinLead agents extract, match and flag statement variances before finance teams lose another day in spreadsheets.",
    output: (value) => ({
      primary: `${Math.round(value * 42).toLocaleString()} line items checked`,
      secondary: `${Math.max(4, Math.round(value / 28))} review queues prepared for finance`,
      note: "Best first pilot when payout, clawback or rate mismatches are slowing month-end close.",
    }),
  },
  {
    id: "onboarding",
    icon: ClipboardCheck,
    label: "Producer onboarding",
    question: "How many producers or agents do you onboard in a quarter?",
    unit: "producers",
    min: 10,
    max: 600,
    defaultValue: 95,
    line: "FinLead agents follow documents, licenses, agreements and activation checks without the manual chase.",
    output: (value) => ({
      primary: `${Math.round(value * 5).toLocaleString()} checks sequenced`,
      secondary: `${Math.max(2, Math.round(value / 18))} exceptions routed to the right owner`,
      note: "Best first pilot when teams are waiting on documents, license checks or repeated producer follow-ups.",
    }),
  },
  {
    id: "leakage",
    icon: ShieldCheck,
    label: "Leakage intelligence",
    question: "How many payout or profitability records should agents inspect?",
    unit: "records",
    min: 100,
    max: 5000,
    defaultValue: 1200,
    line: "FinLead agents watch commissions, claims and distribution performance for patterns that quietly eat margin.",
    output: (value) => ({
      primary: `${Math.round(value * 0.12).toLocaleString()} anomalies screened`,
      secondary: `${Math.max(3, Math.round(value / 420))} root-cause views prepared`,
      note: "Best first pilot when leakage is suspected, but the source is spread across reports and teams.",
    }),
  },
];

const audienceNotes = [
  "For insurance finance teams closing books",
  "For MGAs and brokers managing producer networks",
  "For operators replacing spreadsheet-heavy review work",
];

function DemoForm() {
  const [status, setStatus] = useState("idle");
  const [form, setForm] = useState({ name: "", email: "", company: "", note: "" });

  const update = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  async function submit(event) {
    event.preventDefault();
    if (!form.name || !form.email) {
      setStatus("need");
      trackMeetEvent("meet_form_validation_error", {
        form_name: "meet_qr_lead",
        missing_fields: [!form.name && "name", !form.email && "email"].filter(Boolean).join(","),
      });
      return;
    }

    setStatus("sending");
    trackMeetEvent("meet_form_submit", {
      form_name: "meet_qr_lead",
      has_company: Boolean(form.company),
      has_note: Boolean(form.note),
    });
    try {
      const response = await fetch("https://formspree.io/f/xkoelqyb", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          type: "qr_meet_page",
          name: form.name,
          email: form.email,
          company: form.company,
          note: form.note,
          source: "https://finlead.ai/meet",
        }),
      });
      setStatus(response.ok ? "done" : "error");
      trackMeetEvent(response.ok ? "meet_form_success" : "meet_form_error", {
        form_name: "meet_qr_lead",
        status_code: response.status,
      });
    } catch (error) {
      setStatus("error");
      trackMeetEvent("meet_form_error", {
        form_name: "meet_qr_lead",
        error_message: error?.message || "unknown_error",
      });
    }
  }

  if (status === "done") {
    return (
      <div className="mt-form-done" role="status">
        <CheckCircle2 size={18} />
        <p>Thanks. Your note is in. We will reply with a tighter workflow view for your team.</p>
      </div>
    );
  }

  return (
    <form className="mt-form" onSubmit={submit}>
      <div className="mt-form-grid">
        <label>
          <span>Name</span>
          <input value={form.name} onChange={update("name")} autoComplete="name" />
        </label>
        <label>
          <span>Work email</span>
          <input value={form.email} onChange={update("email")} type="email" autoComplete="email" />
        </label>
      </div>
      <label>
        <span>Company</span>
        <input value={form.company} onChange={update("company")} autoComplete="organization" />
      </label>
      <label>
        <span>What should we show you?</span>
        <textarea
          value={form.note}
          onChange={update("note")}
          rows={3}
          placeholder="Example: commission reconciliation for a broker network"
        />
      </label>
      <button className="mt-primary" type="submit" disabled={status === "sending"}>
        {status === "sending" ? "Sending" : "Send a note"}
        <ArrowRight size={16} />
      </button>
      {status === "need" && <p className="mt-error">Please add your name and work email.</p>}
      {status === "error" && (
        <p className="mt-error">
          Something went wrong. Email <a href={`mailto:${FOUNDER_EMAIL}`}>{FOUNDER_EMAIL}</a>.
        </p>
      )}
    </form>
  );
}

export default function MeetExperience() {
  const [activeId, setActiveId] = useState(workflows[0].id);
  const active = workflows.find((item) => item.id === activeId) || workflows[0];
  const [volumes, setVolumes] = useState(
    workflows.reduce((acc, item) => ({ ...acc, [item.id]: item.defaultValue }), {})
  );
  const activeValue = volumes[active.id];
  const result = useMemo(() => active.output(activeValue), [active, activeValue]);
  const ActiveIcon = active.icon;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    trackMeetEvent("meet_qr_page_view", {
      source: params.get("utm_source") || "qr_card",
      medium: params.get("utm_medium") || "qr",
      campaign: params.get("utm_campaign") || "visiting_card",
      event_name: params.get("event") || "unspecified",
    });
  }, []);

  function selectWorkflow(workflowId) {
    setActiveId(workflowId);
    trackMeetEvent("meet_workflow_select", {
      workflow_id: workflowId,
      workflow_label: workflows.find((item) => item.id === workflowId)?.label,
    });
  }

  function trackPrototypeVolume() {
    trackMeetEvent("meet_prototype_volume_change", {
      workflow_id: active.id,
      workflow_label: active.label,
      volume: activeValue,
      unit: active.unit,
    });
  }

  return (
    <main className="mt-root">
      <div className="mt-grain" />

      <header className="mt-topbar" aria-label="FinLead AI">
        <a className="mt-brand" href="/">
          <img src="/FinLeadAILogo.png" alt="FinLead AI" />
        </a>
        <a
          className="mt-toplink"
          href={`mailto:${FOUNDER_EMAIL}?subject=Met%20FinLead%20AI%20from%20QR`}
          onClick={() => trackMeetEvent("meet_cta_click", { cta_name: "write_to_founder", cta_location: "topbar" })}
        >
          <Mail size={16} />
          <span>Write to founder</span>
        </a>
      </header>

      <section className="mt-hero">
        <div className="mt-hero-copy">
          <p className="mt-kicker">
            <ScanLine size={15} />
            You scanned the right card
          </p>
          <h1>
            Meet the AI agents built for insurance back-office work.
          </h1>
          <p className="mt-dek">
            FinLead AI helps insurers, brokers, MGAs and distribution teams move repetitive finance and operations work out of spreadsheets and into agent-run workflows.
          </p>
          <div className="mt-actions">
            <a
              className="mt-primary"
              href="#prototype"
              onClick={() => trackMeetEvent("meet_cta_click", { cta_name: "try_quick_prototype", cta_location: "hero" })}
            >
              Try the quick prototype
              <Sparkles size={16} />
            </a>
            <a
              className="mt-secondary"
              href={`mailto:${FOUNDER_EMAIL}?subject=FinLead%20AI%20demo`}
              onClick={() => trackMeetEvent("meet_cta_click", { cta_name: "book_demo", cta_location: "hero" })}
            >
              Book a demo
              <MessageSquareText size={16} />
            </a>
          </div>
        </div>

        <aside className="mt-signal" aria-label="What you can do here">
          <BadgeCheck size={18} />
          <p>In the next minute, see where FinLead agents can remove manual insurance ops work.</p>
          <ul>
            <li>Pick a painful workflow</li>
            <li>Adjust the monthly volume</li>
            <li>Send us the demo you want to see</li>
          </ul>
        </aside>
      </section>

      <section className="mt-strip" aria-label="Who this is for">
        {audienceNotes.map((item) => (
          <span key={item}>{item}</span>
        ))}
      </section>

      <section className="mt-prototype" id="prototype">
        <div className="mt-section-head">
          <p className="mt-kicker">
            <Sparkles size={15} />
            Quick prototype
          </p>
          <h2>Pick the workflow that hurts today.</h2>
        </div>

        <div className="mt-workbench">
          <div className="mt-workflows" role="tablist" aria-label="Insurance workflows">
            {workflows.map((item) => {
              const Icon = item.icon;
              const selected = item.id === active.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  className="mt-workflow-button"
                  data-active={selected}
                  onClick={() => selectWorkflow(item.id)}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-demo-panel">
            <div className="mt-demo-header">
              <ActiveIcon size={22} />
              <div>
                <h3>{active.label}</h3>
                <p>{active.line}</p>
              </div>
            </div>

            <label className="mt-slider">
              <span>{active.question}</span>
              <strong>
                {activeValue.toLocaleString()} {active.unit}
              </strong>
              <input
                type="range"
                min={active.min}
                max={active.max}
                value={activeValue}
                onChange={(event) =>
                  setVolumes((current) => ({ ...current, [active.id]: Number(event.target.value) }))
                }
                onMouseUp={trackPrototypeVolume}
                onTouchEnd={trackPrototypeVolume}
                onKeyUp={(event) => {
                  if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) trackPrototypeVolume();
                }}
              />
            </label>

            <div className="mt-output" aria-live="polite">
              <div>
                <span>Agent pass</span>
                <strong>{result.primary}</strong>
              </div>
              <div>
                <span>Human review</span>
                <strong>{result.secondary}</strong>
              </div>
            </div>

            <p className="mt-note">{result.note}</p>
          </div>
        </div>
      </section>

      <section className="mt-contact" aria-label="Continue the conversation">
        <div>
          <p className="mt-kicker">
            <MessageSquareText size={15} />
            Continue after the event
          </p>
          <h2>Tell us what you want the next demo to show.</h2>
          <p>
            Keep it simple. A workflow name, a monthly volume, or one messy process is enough for us to shape the next conversation.
          </p>
        </div>
        <DemoForm />
      </section>
    </main>
  );
}
