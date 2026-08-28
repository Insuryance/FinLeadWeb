(() => {
  "use strict";

  const PARENT_SOURCE = "finlead-solutions-lab";
  const PORTAL_SOURCE = "oceanguard-portal";
  const params = new URLSearchParams(window.location.search);
  const configuredParentOrigin = params.get("parentOrigin");
  const parentOrigin = configuredParentOrigin || "*";
  const standalonePreview = params.get("preview") === "1";

  if (window.parent === window) {
    window.location.replace("/playground/marine-coi");
    return;
  }

  const defaultShipment = {
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
    certificate_named_party: "Hansen Imports GmbH"
  };

  let shipment = { ...defaultShipment };
  let running = false;
  let awaitingApproval = false;
  let standaloneMode = window.parent === window;

  const views = Array.from(document.querySelectorAll(".view"));
  const cursor = document.getElementById("automation-cursor");
  const notice = document.getElementById("automation-notice");
  const noticeTitle = document.getElementById("automation-title");
  const noticeMessage = document.getElementById("automation-message");
  const submitButton = document.getElementById("submit-declaration");

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const motionScale = prefersReducedMotion ? 0.12 : 1;
  const delay = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms * motionScale));

  function emit(type, payload = {}) {
    if (standaloneMode) return;
    window.parent.postMessage({ source: PORTAL_SOURCE, type, payload }, parentOrigin);
  }

  function isTrustedParent(event) {
    if (event.source !== window.parent) return false;
    if (configuredParentOrigin && event.origin !== configuredParentOrigin) return false;
    return event.data?.source === PARENT_SOURCE;
  }

  function showView(name) {
    views.forEach((view) => view.classList.toggle("active", view.dataset.view === name));
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  function setNotice(title, message, isRunning = false) {
    noticeTitle.textContent = title;
    noticeMessage.textContent = message;
    notice.classList.toggle("running", isRunning);
  }

  function setCursorVisible(visible) {
    cursor.classList.toggle("visible", visible);
  }

  async function pointTo(element) {
    if (!element) return;
    const rect = element.getBoundingClientRect();
    cursor.style.left = `${Math.max(6, rect.left + rect.width * 0.52)}px`;
    cursor.style.top = `${Math.max(6, rect.top + rect.height * 0.58)}px`;
    cursor.classList.toggle("label-left", rect.left + rect.width * 0.52 > window.innerWidth - 185);
    cursor.classList.toggle("label-up", rect.top + rect.height * 0.58 > window.innerHeight - 68);
    element.classList.add("auto-target");
    setCursorVisible(true);
    await delay(1050);
    element.classList.remove("auto-target");
  }

  async function typeInto(input, value, speed = 42) {
    await pointTo(input);
    input.focus({ preventScroll: true });
    input.value = "";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    for (const character of value) {
      input.value += character;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      await delay(speed);
    }
    await delay(320);
    input.blur();
  }

  async function clickTarget(element) {
    await pointTo(element);
    await delay(360);
    element.click();
    await delay(850);
  }

  function eventStep(step, label, detail, status = "running") {
    emit("AUTOMATION_EVENT", { step, label, detail, status });
  }

  async function runAutomation() {
    if (running || awaitingApproval) return;
    running = true;
    try {
      resetPortal(false);
      running = true;
      eventStep("authenticate", "Signing in to OceanGuard", "Using the stored broker credential");
      await typeInto(document.getElementById("username"), "meridian.textiles.broker", 46);
      await typeInto(document.getElementById("password"), "oceanguard-2026", 58);
      await clickTarget(document.querySelector('[data-auto-target="sign-in"]'));
      eventStep("authenticate", "Signed in to OceanGuard", "Broker account authenticated", "complete");

      eventStep("navigate", "Opening the declaration workspace", "Policy OC-2026-MT-0042 selected");
      await delay(1100);
      await clickTarget(document.getElementById("new-declaration"));
      eventStep("navigate", "Declaration form opened", "Eighteen portal fields are ready", "complete");

      setNotice("Automation is filling the declaration", "Values are being entered from the validated shipment record.", true);
      eventStep("fill", "Entering shipment details", "Mapping extracted values to OceanGuard fields");
      const fields = [
        "declarant_name", "bl_number", "invoice_number", "invoice_date", "currency",
        "vessel_name", "voyage_number", "port_of_loading", "port_of_discharge",
        "shipped_on_board_date", "incoterm", "goods_description", "invoice_value",
        "sum_insured", "cargo_clause", "buyer_name", "buyer_address", "certificate_named_party"
      ];
      for (let index = 0; index < fields.length; index += 1) {
        const fieldName = fields[index];
        const input = document.querySelector(`[data-field="${fieldName}"]`);
        const label = input?.closest("label");
        input?.scrollIntoView({ behavior: "smooth", block: "center" });
        await delay(460);
        label?.classList.add("auto-active");
        await typeInto(input, shipment[fieldName] || "", fieldName === "goods_description" ? 28 : 40);
        label?.classList.remove("auto-active");
        label?.classList.add("auto-filled");
        emit("AUTOMATION_EVENT", {
          step: "fill",
          label: `Filled ${index + 1} of ${fields.length} fields`,
          detail: input?.closest("label")?.childNodes[0]?.textContent?.trim() || fieldName,
          status: "running",
          progress: index + 1,
          total: fields.length
        });
      }
      submitButton.disabled = false;
      awaitingApproval = true;
      running = false;
      setCursorVisible(false);
      setNotice("Review required", `All ${fields.length} fields are filled. Confirm the values before submission.`, false);
      eventStep("fill", "Declaration populated", `${fields.length} fields completed from Invoice and Bill of Lading`, "complete");
      emit("REVIEW_REQUIRED", { fields: fields.length, shipment });
    } catch (error) {
      running = false;
      setCursorVisible(false);
      setNotice("Automation stopped", "Reset the workflow and try again.", false);
      emit("PORTAL_ERROR", { message: error instanceof Error ? error.message : "Portal automation failed." });
    }
  }

  async function approveSubmission() {
    if (!awaitingApproval || running) return;
    running = true;
    eventStep("submit", "Submitting the declaration", "Human review approved");
    await clickTarget(submitButton);
    eventStep("submit", "Declaration accepted", "Certificate generation started", "complete");
    eventStep("certificate", "Retrieving certificate", "OceanGuard is issuing the COI");
    await delay(1600);
    setCertificateValues();
    showView("certificate");
    setCursorVisible(false);
    running = false;
    awaitingApproval = false;
    eventStep("certificate", "Certificate retrieved", "COI_MSCUAB124477_2026-08-17.pdf is ready", "complete");
    emit("AUTOMATION_COMPLETE", {
      certificateNumber: "OG-CERT-884213",
      fileName: `COI_${shipment.bl_number}_2026-08-17.pdf`
    });
  }

  function setCertificateValues() {
    const values = {
      bl_number: shipment.bl_number,
      vessel_voyage: `${shipment.vessel_name} / ${shipment.voyage_number}`,
      route: `${shipment.port_of_loading.split(",")[0]} → ${shipment.port_of_discharge.split(",")[0]}`,
      invoice_value: shipment.invoice_value,
      sum_insured: shipment.sum_insured,
      cargo_clause: shipment.cargo_clause,
      certificate_named_party: shipment.certificate_named_party
    };
    Object.entries(values).forEach(([key, value]) => {
      const target = document.querySelector(`[data-cert="${key}"]`);
      if (target) target.textContent = value;
    });
  }

  function resetPortal(emitEvent = true) {
    running = false;
    awaitingApproval = false;
    showView("login");
    document.getElementById("username").value = "";
    document.getElementById("password").value = "";
    document.querySelectorAll("[data-field]").forEach((input) => { input.value = ""; });
    document.querySelectorAll(".auto-filled, .auto-active").forEach((node) => node.classList.remove("auto-filled", "auto-active"));
    submitButton.disabled = true;
    setCursorVisible(false);
    setNotice("Ready for shipment data", "Waiting for the browser workflow to begin.", false);
    if (emitEvent) emit("AUTOMATION_EVENT", { step: "reset", label: "Portal reset", detail: "Ready for another shipment", status: "complete" });
  }

  function escapePdfText(value) {
    return String(value).replace(/[\\()]/g, (character) => `\\${character}`).replace(/[—→]/g, "-");
  }

  function buildCertificatePdf() {
    const lines = [
      "OCEANGUARD GENERAL INSURANCE",
      "Certificate of Marine Insurance",
      "Issued under Open Cover OC-2026-MT-0042",
      "",
      "Certificate No: OG-CERT-884213",
      `B/L Number: ${shipment.bl_number}`,
      `Vessel / Voyage: ${shipment.vessel_name} / ${shipment.voyage_number}`,
      `Route: ${shipment.port_of_loading} to ${shipment.port_of_discharge}`,
      `Invoice Value: ${shipment.invoice_value}`,
      `Sum Insured: ${shipment.sum_insured}`,
      `Cargo Clause: ${shipment.cargo_clause}`,
      `Named Party: ${shipment.certificate_named_party}`,
      "Issue Date: 17 Aug 2026"
    ];
    const commands = ["BT", "/F1 16 Tf", "72 760 Td"];
    lines.forEach((line, index) => {
      if (index === 1) commands.push("/F1 20 Tf");
      if (index === 2) commands.push("/F1 10 Tf");
      if (index === 4) commands.push("/F1 12 Tf");
      commands.push(`(${escapePdfText(line)}) Tj`, "0 -30 Td");
    });
    commands.push("ET");
    const stream = commands.join("\n");
    const objects = [
      "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
      "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
      "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >> endobj",
      `4 0 obj << /Length ${stream.length} >> stream\n${stream}\nendstream endobj`,
      "5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj"
    ];
    let pdf = "%PDF-1.4\n";
    const offsets = [0];
    objects.forEach((object) => { offsets.push(pdf.length); pdf += `${object}\n`; });
    const xrefOffset = pdf.length;
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    offsets.slice(1).forEach((offset) => { pdf += `${String(offset).padStart(10, "0")} 00000 n \n`; });
    pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
    return new Blob([pdf], { type: "application/pdf" });
  }

  function downloadCertificate() {
    const blob = buildCertificatePdf();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `COI_${shipment.bl_number}_2026-08-17.pdf`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    emit("AUTOMATION_EVENT", { step: "download", label: "Certificate downloaded", detail: anchor.download, status: "complete" });
  }

  document.getElementById("login-form").addEventListener("submit", (event) => { event.preventDefault(); showView("dashboard"); });
  document.getElementById("new-declaration").addEventListener("click", () => showView("form"));
  document.getElementById("declaration-form").addEventListener("submit", (event) => { event.preventDefault(); if (standaloneMode) approveSubmission(); });
  document.getElementById("portal-run").addEventListener("click", runAutomation);
  document.getElementById("download-certificate").addEventListener("click", downloadCertificate);
  document.querySelectorAll('[data-action="dashboard"]').forEach((button) => button.addEventListener("click", (event) => { event.preventDefault(); showView("dashboard"); }));

  window.addEventListener("message", (event) => {
    if (!isTrustedParent(event)) return;
    const { type, payload } = event.data;
    if (type === "LOAD_SHIPMENT") {
      shipment = { ...defaultShipment, ...(payload || {}) };
      const accountName = document.getElementById("portal-account-name");
      if (accountName) accountName.textContent = shipment.declarant_name;
      emit("AUTOMATION_EVENT", { step: "handoff", label: "Shipment data received", detail: `${shipment.invoice_number} · ${shipment.bl_number}`, status: "complete" });
    } else if (type === "START_AUTOMATION") {
      runAutomation();
    } else if (type === "APPROVE_SUBMISSION") {
      approveSubmission();
    } else if (type === "RESET_PORTAL") {
      resetPortal();
    }
  });

  window.addEventListener("load", () => {
    emit("PORTAL_READY", { version: 1 });
    if (standaloneMode || standalonePreview) {
      document.getElementById("username").value = "meridian.textiles.broker";
      document.getElementById("password").value = "oceanguard-2026";
    }
  });
})();
