"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Circle,
  Cloud,
  ExternalLink,
  FileCheck2,
  FileText,
  LoaderCircle,
  LockKeyhole,
  MonitorUp,
  Pencil,
  RefreshCw,
  Save,
  Server,
  ShieldCheck,
  Ship,
  UploadCloud,
} from "lucide-react";

const PORTAL_BASE_URL = "/marine-insurer-portal/index.html";
const PARENT_SOURCE = "finlead-solutions-lab";
const PORTAL_SOURCE = "oceanguard-portal";

const SAMPLE_DOCUMENTS = [
  "/marine-insurer-portal/samples/Commercial_Invoice_INV-2026-0417.pdf",
  "/marine-insurer-portal/samples/Bill_of_Lading_MSCUAB124477.pdf",
];

const DEFAULT_SHIPMENT = {
  declarant_name: "Meridian Textiles Pvt Ltd",
  invoice_number: "INV-2026-0417",
  invoice_date: "12 Aug 2026",
  invoice_value: "USD 42,500.00",
  currency: "USD",
  goods_description: "500 cartons cotton fabric rolls",
  incoterm: "CIF Hamburg",
  buyer_name: "Hansen Imports GmbH",
  buyer_address: "Hamburg, Germany",
  bl_number: "MSCUAB124477",
  vessel_name: "MSC Bellissima",
  voyage_number: "24W",
  port_of_loading: "Nhava Sheva, India",
  port_of_discharge: "Hamburg, Germany",
  shipped_on_board_date: "14 Aug 2026",
  sum_insured: "USD 46,750.00",
  cargo_clause: "Institute Cargo Clauses (A)",
  certificate_named_party: "Hansen Imports GmbH",
};

const PARSE_SEQUENCE = [
  ["Classifying both documents", "Reading document structure and identifiers"],
  ["Extracting commercial terms", "Invoice number, value, buyer, goods, and Incoterm"],
  ["Reading shipment movement", "B/L number, vessel, voyage, ports, and shipped date"],
  ["Cross-checking shared fields", "Goods and named parties agree across both files"],
  ["Confirming insured value", "Insured value validated at USD 46,750.00"],
];

const EXTRACTION_STEP_DURATIONS_MS = [4000, 6000, 4800, 6500, 3700];

const FIELD_GROUPS = [
  ["Commercial document", [
    ["Exporter / declarant", "declarant_name"],
    ["Invoice number", "invoice_number"],
    ["Invoice date", "invoice_date"],
    ["Invoice value", "invoice_value"],
    ["Currency", "currency"],
    ["Goods description", "goods_description"],
    ["Incoterm", "incoterm"],
    ["Buyer", "buyer_name"],
    ["Buyer address", "buyer_address"],
  ]],
  ["Shipment movement", [
    ["Bill of Lading", "bl_number"],
    ["Vessel", "vessel_name"],
    ["Voyage", "voyage_number"],
    ["Port of loading", "port_of_loading"],
    ["Port of discharge", "port_of_discharge"],
    ["Shipped on board", "shipped_on_board_date"],
  ]],
  ["Insurance instruction", [
    ["Sum insured", "sum_insured"],
    ["Cargo clause", "cargo_clause"],
    ["Named party", "certificate_named_party"],
  ]],
];

const WORKFLOW_STEPS = [
  ["Add documents", "Invoice and Bill of Lading"],
  ["Read and classify", "Identify each source"],
  ["Validate shipment", "Check and calculate values"],
  ["Run portal workflow", "Enter, review, and issue COI"],
];

const BOOT_STEPS = [
  ["Allocating isolated browser", Server],
  ["Applying broker security profile", ShieldCheck],
  ["Establishing portal connection", LockKeyhole],
  ["Opening OceanGuard", MonitorUp],
];

const EXTRACTED_FIELD_COUNT = FIELD_GROUPS.reduce((total, [, fields]) => total + fields.length, 0);

/** Whichever file reads as the invoice becomes the invoice; the other is the bill of lading. */
const classifyDocuments = (files) => {
  const invoiceIndex = files.findIndex((file) => /invoice|inv[-_\s]/i.test(file.name));
  const billIndex = files.findIndex((file) => /bill|lading|b[\s_-]?l/i.test(file.name));
  return files.map((file, index) => {
    const isInvoice = invoiceIndex >= 0 ? index === invoiceIndex : billIndex >= 0 ? index !== billIndex : index === 0;
    return { file, type: isInvoice ? "Commercial Invoice" : "Bill of Lading", confidence: isInvoice ? 99.2 : 98.7 };
  });
};

function Toast({ toast, onDismiss }) {
  // onDismiss is a fresh closure each render; hold it in a ref so the 5s timer keys off `toast`
  // alone and is not restarted by unrelated parent re-renders (portal events fire often).
  const dismissRef = useRef(onDismiss);
  dismissRef.current = onDismiss;
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => dismissRef.current(), 5000);
    return () => clearTimeout(timer);
  }, [toast]);
  if (!toast) return null;
  return <div className={`mc-toast mc-toast-${toast.tone}`} role="status">
    {toast.tone === "success" ? <CheckCircle2 size={18} aria-hidden="true" /> : <ShieldCheck size={18} aria-hidden="true" />}
    <p>{toast.message}</p>
  </div>;
}

function UploadPanel({ isDragging, onBrowse, onDragStateChange, onFiles, onSample, loadingSample }) {
  return <section>
    <div className="mc-panel-head">
      <span className="mc-panel-icon"><Ship size={20} aria-hidden="true" /></span>
      <div>
        <h2>Prepare a shipment declaration</h2>
        <p>Add the two documents that identify the goods and their sea journey. Both PDFs are required before the portal workflow can begin.</p>
      </div>
    </div>

    <div
      className={`mc-dropzone${isDragging ? " mc-dropzone-active" : ""}`}
      onDragOver={(event) => { event.preventDefault(); onDragStateChange(true); }}
      onDragLeave={() => onDragStateChange(false)}
      onDrop={(event) => { event.preventDefault(); onDragStateChange(false); onFiles(event.dataTransfer.files); }}
    >
      <div>
        <span className="mc-dropzone-icon"><UploadCloud size={24} aria-hidden="true" /></span>
        <h3>Drop both shipment PDFs here</h3>
        <p>Commercial Invoice + Bill of Lading · PDF · up to 20 MB each</p>
        <div className="mc-dropzone-actions">
          <button type="button" className="mc-btn mc-btn-primary" onClick={onBrowse}>
            <FileText size={16} aria-hidden="true" /> Select two documents
          </button>
          <button type="button" className="mc-btn mc-btn-outline" disabled={loadingSample} onClick={onSample}>
            {loadingSample ? <LoaderCircle size={16} className="mc-spin" aria-hidden="true" /> : <FileCheck2 size={16} aria-hidden="true" />}
            Use the sample pair
          </button>
        </div>
      </div>
    </div>

    <div className="mc-requirements">
      <div><FileCheck2 size={20} aria-hidden="true" /><div><p>Commercial Invoice</p><p>Seller, buyer, invoice value, goods, and Incoterm</p></div></div>
      <div><FileCheck2 size={20} aria-hidden="true" /><div><p>Bill of Lading</p><p>B/L number, vessel, voyage, ports, and shipped date</p></div></div>
    </div>
  </section>;
}

function ParsingPanel({ documents, activeIndex }) {
  const progress = Math.min(96, 12 + (activeIndex + 1) * 17);
  return <section aria-live="polite">
    <div className="mc-panel-head mc-panel-head-split">
      <div><h2>Reading shipment documents</h2><p>Checking each value before it moves into the insurer portal.</p></div>
      <span className="mc-progress-value">{progress}%</span>
    </div>
    <div className="mc-progress"><div style={{ width: `${progress}%` }} /></div>

    <div className="mc-doc-tiles">
      {documents.map((document) => <div key={document.file.name}>
        <span className="mc-doc-icon"><FileText size={20} aria-hidden="true" /></span>
        <div><p>{document.file.name}</p><p>{document.type} · {document.confidence}% match</p></div>
        <Check size={16} className="mc-check" aria-hidden="true" />
      </div>)}
    </div>

    <div className="mc-steps">
      {PARSE_SEQUENCE.map(([label, detail], index) => <div key={label} className={index > activeIndex ? "mc-step-idle" : ""}>
        {index < activeIndex ? <CheckCircle2 size={20} className="mc-check" aria-hidden="true" />
          : index === activeIndex ? <LoaderCircle size={20} className="mc-spin mc-accent" aria-hidden="true" />
          : <Circle size={20} className="mc-dim" aria-hidden="true" />}
        <div><p>{label}</p><p>{detail}</p></div>
      </div>)}
    </div>
  </section>;
}

function ExtractionReview({ documents, details, onSave, onRun }) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState({ ...details });
  const [validationError, setValidationError] = useState("");
  const hasChanges = FIELD_GROUPS.some(([, fields]) => fields.some(([, field]) => draft[field] !== details[field]));

  const beginEditing = () => { setDraft({ ...details }); setValidationError(""); setIsEditing(true); };
  const cancelEditing = () => { setDraft({ ...details }); setValidationError(""); setIsEditing(false); };
  const saveChanges = () => {
    const normalized = Object.fromEntries(Object.entries(draft).map(([field, value]) => [field, value.trim()]));
    const emptyField = FIELD_GROUPS.flatMap(([, fields]) => fields).find(([, field]) => !normalized[field]);
    if (emptyField) { setValidationError(`${emptyField[0]} cannot be empty.`); return; }
    onSave(normalized);
    setDraft(normalized);
    setValidationError("");
    setIsEditing(false);
  };

  return <section>
    <div className="mc-panel-head mc-panel-head-split">
      <div>
        <p className="mc-validated"><CheckCircle2 size={18} aria-hidden="true" /> Validation passed</p>
        <h2>Shipment details are ready</h2>
        <p>Review the extracted values and correct anything before the portal run.</p>
      </div>
      <div className="mc-panel-actions">
        {isEditing ? <>
          <button type="button" className="mc-btn mc-btn-outline" onClick={cancelEditing}>Cancel</button>
          <button type="button" className="mc-btn mc-btn-primary" disabled={!hasChanges} onClick={saveChanges}><Save size={16} aria-hidden="true" /> Save changes</button>
        </> : <>
          <button type="button" className="mc-btn mc-btn-outline" onClick={beginEditing}><Pencil size={16} aria-hidden="true" /> Edit details</button>
          <button type="button" className="mc-btn mc-btn-primary" onClick={onRun}><MonitorUp size={16} aria-hidden="true" /> Run portal automation <ArrowRight size={16} aria-hidden="true" /></button>
        </>}
      </div>
    </div>

    {validationError && <p role="alert" className="mc-error">{validationError}</p>}

    <div className="mc-field-groups">
      {FIELD_GROUPS.map(([title, fields]) => <section key={title}>
        <h3>{title}</h3>
        <dl>
          {fields.map(([label, field]) => <div key={field}>
            <dt><label htmlFor={`shipment-${field}`}>{label}</label></dt>
            <dd>{isEditing
              ? <input id={`shipment-${field}`} value={draft[field]} maxLength={200} aria-invalid={validationError.startsWith(label)}
                  onChange={(event) => { setDraft((current) => ({ ...current, [field]: event.target.value })); if (validationError) setValidationError(""); }} />
              : <span>{details[field]}</span>}</dd>
          </div>)}
        </dl>
      </section>)}
    </div>

    <div className="mc-summary">
      <span>{documents.length} documents · {EXTRACTED_FIELD_COUNT} validated fields · sum insured calculated</span>
      <span className="mc-summary-ready"><ShieldCheck size={16} aria-hidden="true" />{isEditing ? "Review changes before saving" : "Ready for insurer entry"}</span>
    </div>
  </section>;
}

function WorkflowRail({ stage, parseIndex }) {
  const activeStep = stage === "idle" ? 0 : stage === "parsing" ? Math.min(2, parseIndex > 2 ? 2 : 1) : 3;
  return <aside className="mc-rail">
    <p className="mc-rail-title">Workflow</p>
    <ol>
      {WORKFLOW_STEPS.map(([title, detail], index) => {
        const complete = index < activeStep;
        const active = index === activeStep;
        return <li key={title} className={complete ? "mc-rail-complete" : active ? "mc-rail-active" : ""}>
          {index < WORKFLOW_STEPS.length - 1 && <span className="mc-rail-line" />}
          <span className="mc-rail-dot">{complete ? <Check size={14} aria-hidden="true" /> : index + 1}</span>
          <div><p>{title}</p><p>{detail}</p></div>
        </li>;
      })}
    </ol>
    <div className="mc-rail-note">
      <p><LockKeyhole size={16} aria-hidden="true" /> Human approval stays on</p>
      <p>The workflow fills the declaration, then waits before sending it to the insurer.</p>
    </div>
  </aside>;
}

function ConnectionBootScreen({ phase }) {
  return <div className="mc-boot">
    <div>
      <div className="mc-boot-ring"><span /><span /><span><Cloud size={28} aria-hidden="true" /></span></div>
      <div className="mc-boot-copy">
        <h3>Starting secure browser session</h3>
        <p>FinLead AI is preparing a private connection for this shipment.</p>
      </div>
      <div className="mc-boot-steps">
        {BOOT_STEPS.map(([label, Icon], index) => {
          const complete = index < phase;
          const active = index === phase;
          return <div key={label} className={index > phase ? "mc-step-idle" : ""}>
            <span className={complete ? "mc-boot-icon mc-boot-icon-done" : active ? "mc-boot-icon mc-boot-icon-active" : "mc-boot-icon"}>
              {complete ? <Check size={16} aria-hidden="true" /> : active ? <LoaderCircle size={16} className="mc-spin" aria-hidden="true" /> : <Icon size={16} aria-hidden="true" />}
            </span>
            <span className="mc-boot-label">{label}</span>
            {complete && <span className="mc-boot-ready">Ready</span>}
          </div>;
        })}
      </div>
    </div>
  </div>;
}

function AutomationWorkspace({ stage, events, details, portalUrl, portalReady, connectionPhase, iframeKey, iframeRef, onApprove, onRetry }) {
  const statusTone = stage === "complete" ? "mc-dot-done" : stage === "error" ? "mc-dot-error" : "mc-dot-busy";
  return <section className="mc-workspace">
    <div className="mc-workspace-grid">
      <aside className="mc-console">
        <div className="mc-console-head">
          <div><p>Automation run</p><span className={`mc-dot ${statusTone}`} /></div>
          <p>{details.invoice_number} · {details.bl_number}</p>
        </div>
        <div className="mc-console-body">
          {events.length === 0 ? <div className="mc-console-event">
            <LoaderCircle size={16} className="mc-spin" aria-hidden="true" />
            <div>
              <p>{stage === "connecting" ? "Preparing secure browser" : "Connecting to portal"}</p>
              <p>{stage === "connecting" ? "Starting an isolated session for this declaration." : "Waiting for OceanGuard to report ready."}</p>
            </div>
          </div> : events.map((event, index) => <div key={`${event.step}-${index}-${event.label}`} className="mc-console-event">
            {event.status === "complete" ? <CheckCircle2 size={16} className="mc-console-done" aria-hidden="true" /> : <LoaderCircle size={16} className="mc-spin mc-console-busy" aria-hidden="true" />}
            <div><p>{event.label}</p><p>{event.detail}</p></div>
          </div>)}
        </div>
        <div className="mc-console-foot">
          {stage === "review" ? <div className="mc-approve">
            <p>The declaration is waiting for you</p>
            <p>Review the populated form in the browser, then allow submission.</p>
            <button type="button" className="mc-btn mc-btn-approve" onClick={onApprove}>Approve declaration</button>
          </div> : stage === "complete" ? <div>
            <p className="mc-console-issued"><CheckCircle2 size={16} aria-hidden="true" /> Certificate issued</p>
            <p className="mc-console-hint">Download the COI from the portal and return to the policy overview when ready.</p>
          </div> : stage === "error" ? <div>
            <p className="mc-console-stopped">Portal connection stopped</p>
            <button type="button" className="mc-btn mc-btn-reconnect" onClick={onRetry}>Reconnect</button>
          </div> : <p className="mc-console-hint mc-console-lock"><LockKeyhole size={16} aria-hidden="true" /> Submission requires your approval</p>}
        </div>
      </aside>

      <div className="mc-browser-shell">
        <div className="mc-browser">
          <div className="mc-browser-bar">
            <span className="mc-browser-badge"><ShieldCheck size={16} aria-hidden="true" /></span>
            <div><p>OceanGuard Marine Underwriting</p><p>Secure embedded session</p></div>
            <span className="mc-browser-status">
              <span className={portalReady ? "mc-dot mc-dot-done" : "mc-dot mc-dot-busy"} />
              {portalReady ? "Connected" : stage === "connecting" ? "Preparing session" : "Establishing connection"}
            </span>
            <a href={PORTAL_BASE_URL} target="_blank" rel="noreferrer" aria-label="Open the portal in a new tab"><ExternalLink size={16} aria-hidden="true" /></a>
          </div>
          <div className="mc-browser-body">
            {stage === "connecting" ? <ConnectionBootScreen phase={connectionPhase} /> : <>
              {!portalReady && <div className="mc-browser-loading">
                <div>
                  <LoaderCircle size={24} className="mc-spin mc-accent" aria-hidden="true" />
                  <p>Opening OceanGuard</p>
                  <p>Completing the secure portal handshake</p>
                </div>
              </div>}
              <iframe key={iframeKey} ref={iframeRef} src={portalUrl} title="OceanGuard marine underwriting portal" allow="fullscreen" />
            </>}
          </div>
        </div>
      </div>
    </div>
  </section>;
}

export default function MarineCoiPlayground() {
  const inputRef = useRef(null);
  const iframeRef = useRef(null);
  const parsingTimers = useRef([]);
  const connectionTimers = useRef([]);
  const pendingStart = useRef(false);
  const shipmentDetailsRef = useRef({ ...DEFAULT_SHIPMENT });

  const [stage, setStage] = useState("idle");
  const [documents, setDocuments] = useState([]);
  const [parseIndex, setParseIndex] = useState(-1);
  const [portalReady, setPortalReady] = useState(false);
  const [portalEvents, setPortalEvents] = useState([]);
  const [iframeKey, setIframeKey] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [connectionPhase, setConnectionPhase] = useState(0);
  const [shipmentDetails, setShipmentDetails] = useState({ ...DEFAULT_SHIPMENT });
  const [loadingSample, setLoadingSample] = useState(false);
  const [toast, setToast] = useState(null);

  const showBrowser = ["connecting", "automating", "review", "complete", "error"].includes(stage);
  const notify = (message, tone = "success") => setToast({ message, tone });

  const portalUrl = useMemo(() => {
    if (typeof window === "undefined") return PORTAL_BASE_URL;
    try {
      const url = new URL(PORTAL_BASE_URL, window.location.origin);
      url.searchParams.set("parentOrigin", window.location.origin);
      return url.toString();
    } catch {
      return PORTAL_BASE_URL;
    }
  }, []);

  const portalOrigin = useMemo(() => {
    if (typeof window === "undefined") return "*";
    try {
      return new URL(PORTAL_BASE_URL, window.location.origin).origin;
    } catch {
      return "*";
    }
  }, []);

  const sendToPortal = (type, payload) => {
    iframeRef.current?.contentWindow?.postMessage({ source: PARENT_SOURCE, type, payload }, portalOrigin);
  };

  useEffect(() => {
    const handleMessage = (event) => {
      if (portalOrigin !== "*" && event.origin !== portalOrigin) return;
      if (event.source !== iframeRef.current?.contentWindow) return;
      if (event.data?.source !== PORTAL_SOURCE) return;

      const { type, payload } = event.data;
      if (type === "PORTAL_READY") {
        setPortalReady(true);
        if (pendingStart.current) {
          pendingStart.current = false;
          sendToPortal("LOAD_SHIPMENT", shipmentDetailsRef.current);
          window.setTimeout(() => sendToPortal("START_AUTOMATION"), 180);
        }
      } else if (type === "AUTOMATION_EVENT") {
        setPortalEvents((current) => {
          const withoutSameRunningStep = current.filter((item) => !(item.step === payload.step && item.status === "running"));
          return [...withoutSameRunningStep, payload].slice(-7);
        });
      } else if (type === "REVIEW_REQUIRED") {
        setStage("review");
      } else if (type === "AUTOMATION_COMPLETE") {
        setStage("complete");
        notify(`Certificate ${payload.certificateNumber} is ready.`);
      } else if (type === "PORTAL_ERROR") {
        setStage("error");
        notify(payload?.message || "The portal workflow stopped.", "error");
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [portalOrigin]);

  useEffect(() => () => {
    parsingTimers.current.forEach((timer) => window.clearTimeout(timer));
    connectionTimers.current.forEach((timer) => window.clearTimeout(timer));
  }, []);

  useEffect(() => {
    if (!showBrowser || portalReady || stage === "error") return;
    const timer = window.setTimeout(() => {
      setStage("error");
      notify("The embedded portal did not respond. Check its URL or reconnect.", "error");
    }, 10000);
    return () => window.clearTimeout(timer);
  }, [portalReady, showBrowser, stage]);

  const beginParsing = (files) => {
    parsingTimers.current.forEach((timer) => window.clearTimeout(timer));
    const pdfs = files.filter((file) => file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf"));
    if (pdfs.length !== 2) {
      notify("Select exactly two PDF files: the commercial invoice and bill of lading.", "error");
      return;
    }

    setDocuments(classifyDocuments(pdfs));
    setStage("parsing");
    setParseIndex(0);
    setPortalEvents([]);
    let elapsed = EXTRACTION_STEP_DURATIONS_MS[0];
    PARSE_SEQUENCE.slice(1).forEach((_, index) => {
      parsingTimers.current.push(window.setTimeout(() => setParseIndex(index + 1), elapsed));
      elapsed += EXTRACTION_STEP_DURATIONS_MS[index + 1];
    });
    parsingTimers.current.push(window.setTimeout(() => {
      setStage("ready");
      notify("Shipment details are ready for review.");
    }, elapsed));
  };

  const handleFiles = (fileList) => {
    if (!fileList) return;
    beginParsing(Array.from(fileList));
  };

  /** Playground affordance: a visitor with no shipment PDFs on hand can run the bundled pair. */
  const loadSampleDocuments = async () => {
    setLoadingSample(true);
    try {
      const files = await Promise.all(SAMPLE_DOCUMENTS.map(async (path) => {
        const response = await fetch(path);
        if (!response.ok) throw new Error(`Could not load ${path}`);
        const blob = await response.blob();
        return new File([blob], path.split("/").pop(), { type: "application/pdf" });
      }));
      beginParsing(files);
    } catch {
      notify("The sample documents could not be loaded. Try selecting your own PDFs.", "error");
    } finally {
      setLoadingSample(false);
    }
  };

  const runAutomation = () => {
    connectionTimers.current.forEach((timer) => window.clearTimeout(timer));
    setStage("connecting");
    setConnectionPhase(0);
    setPortalEvents([]);
    pendingStart.current = true;
    [1, 2, 3].forEach((phase, index) => {
      connectionTimers.current.push(window.setTimeout(() => setConnectionPhase(phase), 1250 + index * 1350));
    });
    connectionTimers.current.push(window.setTimeout(() => setStage("automating"), 5400));
  };

  const saveShipmentDetails = (updatedDetails) => {
    shipmentDetailsRef.current = updatedDetails;
    setShipmentDetails(updatedDetails);
    notify("Shipment details updated. The portal will use your changes.");
  };

  const resetWorkflow = () => {
    parsingTimers.current.forEach((timer) => window.clearTimeout(timer));
    connectionTimers.current.forEach((timer) => window.clearTimeout(timer));
    pendingStart.current = false;
    sendToPortal("RESET_PORTAL");
    setDocuments([]);
    setParseIndex(-1);
    setPortalEvents([]);
    setPortalReady(false);
    setIframeKey((current) => current + 1);
    setConnectionPhase(0);
    shipmentDetailsRef.current = { ...DEFAULT_SHIPMENT };
    setShipmentDetails({ ...DEFAULT_SHIPMENT });
    setStage("idle");
  };

  return <main className="cq-root mc-root">
    <header className="cq-topbar">
      <a href="/" aria-label="FinLead AI home"><img src="/FinLeadAILogo.png" alt="FinLead AI" /></a>
      <span>Playground</span>
    </header>
    <div className="cq-page">
      <a className="cq-back" href="/"><ArrowLeft size={16} aria-hidden="true" /> Back to website</a>

      <input ref={inputRef} type="file" accept="application/pdf,.pdf" multiple className="mc-file-input"
        onChange={(event) => { handleFiles(event.target.files); event.target.value = ""; }} />

      <div className="mc-header">
        <div className="cq-title">
          <h1>Marine COI Automation</h1>
          <p>Read an invoice and bill of lading, prepare the marine declaration, and carry it through the insurer portal to a certificate of insurance.</p>
        </div>
        {stage !== "idle" && <button type="button" className="mc-btn mc-btn-outline" onClick={resetWorkflow}>
          <RefreshCw size={16} aria-hidden="true" /> Start another shipment
        </button>}
      </div>

      {!showBrowser ? <div className="mc-shell">
        <div className="mc-shell-grid">
          <div className="mc-shell-main">
            {stage === "idle" ? <UploadPanel isDragging={isDragging} onBrowse={() => inputRef.current?.click()}
                onDragStateChange={setIsDragging} onFiles={handleFiles} onSample={loadSampleDocuments} loadingSample={loadingSample} />
              : stage === "parsing" ? <ParsingPanel documents={documents} activeIndex={parseIndex} />
              : <ExtractionReview documents={documents} details={shipmentDetails} onSave={saveShipmentDetails} onRun={runAutomation} />}
          </div>
          <WorkflowRail stage={stage} parseIndex={parseIndex} />
        </div>
      </div> : <AutomationWorkspace
        stage={stage} events={portalEvents} details={shipmentDetails} portalUrl={portalUrl} portalReady={portalReady}
        connectionPhase={connectionPhase} iframeKey={iframeKey} iframeRef={iframeRef}
        onApprove={() => { setStage("automating"); sendToPortal("APPROVE_SUBMISSION"); }}
        onRetry={() => { setPortalReady(false); setIframeKey((current) => current + 1); pendingStart.current = true; setStage("automating"); }}
      />}
    </div>
    <Toast toast={toast} onDismiss={() => setToast(null)} />
  </main>;
}
