"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Check, CheckCheck, ChevronDown, LoaderCircle, X } from "lucide-react";

const INSURANCE_LINES = [["Motor", "Motor"], ["Health", "Health"], ["PA", "Personal Accident"], ["Travel", "Travel"]];
const PRODUCT_CATEGORIES = [["pc", "Private Car"], ["2w", "Two Wheeler"], ["gcv", "GCV"], ["pcv", "PCV"], ["misD", "Miscellaneous"]];
const POLICY_TYPES = [["Package", "Comprehensive / Package"], ["SAOD", "SAOD"], ["Liability", "Liability / TP"]];
const HEALTH_POLICY_TYPES = [["Fresh", "Fresh"], ["Renewal", "Renewal"], ["Port", "Port"]];
const BUSINESS_TYPES = [["New", "New"], ["Renewal", "Renewal"], ["RollOver", "RollOver"]];
const FUEL_TYPES = ["Petrol", "Diesel", "CNG", "Electric", "Hybrid"];
const PAGE_SIZE = 10;
const ANY_CC = [0, 99999];

/**
 * Each row carries the display cells the grid shows plus the ranges and lists the filters match
 * against, so every control in the panel narrows the result set the way the live grid does.
 */
const CATALOG = {
  pc: {
    columns: [["fuel", "Fuel Type"], ["cc", "Engine Capacity"], ["business", "Business Type"], ["cond", "Special Conditions", true]],
    rows: [
      { insurer: "HDFC ERGO", fuels: ["Petrol", "CNG"], cc: [0, 1000], business: ["New"], od: 32.5, tp: 5, cells: { fuel: "Petrol / CNG", cc: "Up to 1,000 CC", business: "New", cond: "Standard grid" } },
      { insurer: "ICICI LOMBARD", fuels: ["Petrol", "Diesel"], cc: [1001, 1500], business: ["New", "RollOver"], od: 31.75, tp: 5, cells: { fuel: "Petrol / Diesel", cc: "1,001-1,500 CC", business: "New / RollOver", cond: "Subject to inspection approval" } },
      { insurer: "TATA AIG", fuels: FUEL_TYPES, cc: [0, 1500], business: ["Renewal"], od: 30, tp: 4.5, cells: { fuel: "All fuel types", cc: "Up to 1,500 CC", business: "Renewal", cond: "NCB up to 50%" } },
      { insurer: "GO DIGIT", fuels: ["Electric"], cc: ANY_CC, business: ["New"], od: 29.25, tp: 6, cells: { fuel: "Electric", cc: "All capacities", business: "New", cond: "EV private cars only" } },
      { insurer: "BAJAJ ALLIANZ", fuels: ["Petrol", "Diesel"], cc: [1501, 99999], business: ["RollOver"], od: 28.5, tp: 4, cells: { fuel: "Petrol / Diesel", cc: "Above 1,500 CC", business: "RollOver", cond: "Vehicle age below 7 years" } },
      { insurer: "ROYAL SUNDARAM", fuels: ["Petrol"], cc: [0, 1200], business: ["New", "Renewal"], od: 27.75, tp: 5.5, cells: { fuel: "Petrol", cc: "Up to 1,200 CC", business: "New / Renewal", cond: "Nil-dep eligible" } },
      { insurer: "RELIANCE GENERAL", fuels: ["Diesel", "CNG"], cc: ANY_CC, business: ["Renewal"], od: 26.25, tp: 4, cells: { fuel: "Diesel / CNG", cc: "All capacities", business: "Renewal", cond: "No break-in cases" } },
      { insurer: "SBI GENERAL", fuels: FUEL_TYPES, cc: [0, 1500], business: ["New"], od: 25.5, tp: 3.5, cells: { fuel: "All fuel types", cc: "Up to 1,500 CC", business: "New", cond: "Standard grid" } },
      { insurer: "KOTAK GENERAL", fuels: ["Petrol", "Hybrid"], cc: [1001, 1500], business: ["New"], od: 24.75, tp: 4, cells: { fuel: "Petrol / Hybrid", cc: "1,001-1,500 CC", business: "New", cond: "Metro RTOs only" } },
      { insurer: "FUTURE GENERALI", fuels: ["Petrol", "Diesel"], cc: [0, 1000], business: ["Renewal"], od: 24, tp: 3, cells: { fuel: "Petrol / Diesel", cc: "Up to 1,000 CC", business: "Renewal", cond: "Zero-dep add-on excluded" } },
      { insurer: "LIBERTY GENERAL", fuels: ["Diesel"], cc: [1501, 99999], business: ["RollOver"], od: 23.5, tp: 3.5, cells: { fuel: "Diesel", cc: "Above 1,500 CC", business: "RollOver", cond: "Requires prior claim history" } },
      { insurer: "UNIVERSAL SOMPO", fuels: ["CNG"], cc: [0, 1200], business: ["New"], od: 22.75, tp: 4, cells: { fuel: "CNG", cc: "Up to 1,200 CC", business: "New", cond: "CNG kit endorsement required" } },
      { insurer: "SHRIRAM GENERAL", fuels: ["Petrol"], cc: [0, 1000], business: ["Renewal"], od: 21.5, tp: 3, cells: { fuel: "Petrol", cc: "Up to 1,000 CC", business: "Renewal", cond: "Standard grid" } },
      { insurer: "MAGMA HDI", fuels: ["Electric", "Hybrid"], cc: ANY_CC, business: ["New", "Renewal"], od: 20.75, tp: 5, cells: { fuel: "Electric / Hybrid", cc: "All capacities", business: "New / Renewal", cond: "EV and strong hybrid" } },
    ],
  },
  "2w": {
    columns: [["sub", "Subcategory"], ["cc", "Engine Capacity"], ["business", "Business Type"], ["cond", "Special Conditions", true]],
    rows: [
      { insurer: "HDFC ERGO", sub: "Bike", cc: [0, 150], business: ["New"], od: 34, tp: 5, cells: { sub: "Bike", cc: "Up to 150 CC", business: "New", cond: "Standard grid" } },
      { insurer: "TATA AIG", sub: "Scooter", cc: [0, 125], business: ["New"], od: 33.25, tp: 5, cells: { sub: "Scooter", cc: "Up to 125 CC", business: "New", cond: "Standard grid" } },
      { insurer: "ICICI LOMBARD", sub: "Bike", cc: [151, 350], business: ["New", "RollOver"], od: 32, tp: 4.5, cells: { sub: "Bike", cc: "151-350 CC", business: "New / RollOver", cond: "Excludes superbikes" } },
      { insurer: "GO DIGIT", sub: "Scooter", cc: ANY_CC, business: ["Renewal"], od: 31.5, tp: 6, cells: { sub: "Scooter", cc: "All capacities", business: "Renewal", cond: "Electric scooters included" } },
      { insurer: "BAJAJ ALLIANZ", sub: "Bike", cc: [351, 99999], business: ["New"], od: 29.75, tp: 4, cells: { sub: "Bike", cc: "Above 350 CC", business: "New", cond: "Inspection above 500 CC" } },
      { insurer: "RELIANCE GENERAL", sub: "Others", cc: ANY_CC, business: ["Renewal"], od: 28, tp: 4, cells: { sub: "Others", cc: "All capacities", business: "Renewal", cond: "Standard grid" } },
      { insurer: "SBI GENERAL", sub: "Bike", cc: [0, 150], business: ["Renewal"], od: 27.5, tp: 3.5, cells: { sub: "Bike", cc: "Up to 150 CC", business: "Renewal", cond: "No break-in cases" } },
      { insurer: "ROYAL SUNDARAM", sub: "Scooter", cc: [0, 125], business: ["New", "Renewal"], od: 26.25, tp: 4, cells: { sub: "Scooter", cc: "Up to 125 CC", business: "New / Renewal", cond: "Nil-dep eligible" } },
    ],
  },
  gcv: {
    columns: [["sub", "Subcategory"], ["gvw", "Gross Weight"], ["vage", "Vehicle Age"], ["fuel", "Fuel Type"], ["cond", "Special Conditions", true]],
    rows: [
      { insurer: "HDFC ERGO", sub: "3W", weight: [0, 1], vage: [0, 5], fuels: ["CNG", "Diesel"], od: 24, tp: 4, cells: { sub: "3W", gvw: "Up to 1 T", vage: "0-5 years", fuel: "CNG / Diesel", cond: "Goods-carrying 3W" } },
      { insurer: "MAGMA HDI", sub: "3W", weight: [0, 1], vage: [0, 7], fuels: ["Electric"], od: 23.5, tp: 4.5, cells: { sub: "3W", gvw: "Up to 1 T", vage: "0-7 years", fuel: "Electric", cond: "Electric goods 3W" } },
      { insurer: "TATA AIG", sub: "Truck", weight: [12.001, 99], vage: [0, 5], od: 21, tp: 3.5, cells: { sub: "Truck", gvw: "Above 12 T", vage: "0-5 years", cond: "Public carrier permits" } },
      { insurer: "GO DIGIT", sub: "Truck", weight: [2.5, 7.5], vage: [0, 7], od: 20.25, tp: 3, cells: { sub: "Truck", gvw: "2.5-7.5 T", vage: "0-7 years", cond: "Standard grid" } },
      { insurer: "ICICI LOMBARD", sub: "Tipper", weight: [7.5, 12], vage: [0, 7], od: 19.5, tp: 3, cells: { sub: "Tipper", gvw: "7.5-12 T", vage: "0-7 years", cond: "Mining use excluded" } },
      { insurer: "FUTURE GENERALI", sub: "Truck", weight: [0, 2.5], vage: [0, 10], od: 18.5, tp: 3, cells: { sub: "Truck", gvw: "Up to 2.5 T", vage: "0-10 years", cond: "Standard grid" } },
      { insurer: "BAJAJ ALLIANZ", sub: "Tanker", weight: [12.001, 99], vage: [0, 5], od: 17.25, tp: 2.5, cells: { sub: "Tanker", gvw: "Above 12 T", vage: "0-5 years", cond: "Hazardous goods loading applies" } },
      { insurer: "RELIANCE GENERAL", sub: "Trailer", weight: [12.001, 99], vage: [0, 10], od: 16.5, tp: 2.5, cells: { sub: "Trailer", gvw: "Above 12 T", vage: "0-10 years", cond: "Standard grid" } },
      { insurer: "SHRIRAM GENERAL", sub: "Dumper", weight: [12.001, 99], vage: [0, 5], od: 15.75, tp: 2, cells: { sub: "Dumper", gvw: "Above 12 T", vage: "0-5 years", cond: "Requires prior claim history" } },
    ],
  },
  pcv: {
    columns: [["sub", "Subcategory"], ["seats", "Seating"], ["fuel", "Fuel Type"], ["nilDep", "Nil Dep"], ["cond", "Special Conditions", true]],
    rows: [
      { insurer: "HDFC ERGO", sub: "3W", seats: [3, 4], fuels: ["CNG"], od: 25, tp: 4, cells: { sub: "3W", seats: "3-4 seats", fuel: "CNG", cond: "Passenger auto" } },
      { insurer: "MAGMA HDI", sub: "3W", seats: [3, 4], fuels: ["Electric"], od: 24.25, tp: 4.5, cells: { sub: "3W", seats: "3-4 seats", fuel: "Electric", cond: "Electric passenger 3W" } },
      { insurer: "TATA AIG", sub: "Taxi", seats: [4, 6], nilDep: true, od: 22, tp: 3.5, cells: { sub: "Taxi", seats: "4-6 seats", nilDep: "Yes", cond: "App-based fleets" } },
      { insurer: "GO DIGIT", sub: "Taxi", seats: [4, 6], nilDep: true, od: 21.5, tp: 3.5, cells: { sub: "Taxi", seats: "4-6 seats", nilDep: "Yes", cond: "Standard grid" } },
      { insurer: "KOTAK GENERAL", sub: "Taxi", seats: [4, 7], nilDep: true, od: 20.25, tp: 3, cells: { sub: "Taxi", seats: "4-7 seats", nilDep: "Yes", cond: "Metro RTOs only" } },
      { insurer: "ICICI LOMBARD", sub: "School Bus", seats: [20, 40], nilDep: false, od: 18.75, tp: 3, cells: { sub: "School Bus", seats: "20-40 seats", nilDep: "No", cond: "School use endorsement" } },
      { insurer: "BAJAJ ALLIANZ", sub: "Staff Bus", seats: [20, 50], nilDep: false, od: 17.5, tp: 2.5, cells: { sub: "Staff Bus", seats: "20-50 seats", nilDep: "No", cond: "Corporate contracts only" } },
      { insurer: "RELIANCE GENERAL", sub: "Route Bus", seats: [30, 60], nilDep: false, od: 16, tp: 2.5, cells: { sub: "Route Bus", seats: "30-60 seats", nilDep: "No", cond: "Fixed route permits only" } },
    ],
  },
  misD: {
    columns: [["sub", "Subcategory"], ["business", "Business Type"], ["cond", "Special Conditions", true]],
    rows: [
      { insurer: "HDFC ERGO", sub: "Tractor", business: ["New"], od: 26, tp: 4, cells: { sub: "Tractor", business: "New", cond: "Agricultural use" } },
      { insurer: "TATA AIG", sub: "Ambulance", business: ["New"], od: 22.5, tp: 3.5, cells: { sub: "Ambulance", business: "New", cond: "Registered operators" } },
      { insurer: "ICICI LOMBARD", sub: "JCB", business: ["RollOver"], od: 19, tp: 3, cells: { sub: "JCB", business: "RollOver", cond: "Site-only use excluded" } },
      { insurer: "BAJAJ ALLIANZ", sub: "Crane", business: ["New"], od: 17.75, tp: 2.5, cells: { sub: "Crane", business: "New", cond: "Mobile cranes only" } },
      { insurer: "RELIANCE GENERAL", sub: "Excavator", business: ["Renewal"], od: 16.5, tp: 2.5, cells: { sub: "Excavator", business: "Renewal", cond: "Standard grid" } },
      { insurer: "SHRIRAM GENERAL", sub: "Loader", business: ["Renewal"], od: 15.25, tp: 2, cells: { sub: "Loader", business: "Renewal", cond: "Requires prior claim history" } },
    ],
  },
  health: {
    columns: [["plan", "Plan"], ["si", "Sum Insured"], ["ageBand", "Age Band"], ["policy", "Policy Type"], ["cond", "Special Conditions", true]],
    rows: [
      { insurer: "CARE HEALTH", si: [500000, 2500000], age: [18, 45], business: ["Fresh", "Port"], payout: 31, cells: { plan: "Care Supreme", si: "5L - 25L", ageBand: "18-45", policy: "Fresh / Port", cond: "Individual and floater" } },
      { insurer: "STAR HEALTH", si: [500000, 2000000], age: [18, 50], business: ["Fresh"], payout: 29.5, cells: { plan: "Comprehensive", si: "5L - 20L", ageBand: "18-50", policy: "Fresh", cond: "Standard grid" } },
      { insurer: "HDFC ERGO HEALTH", si: [1000000, 5000000], age: [18, 55], business: ["Fresh", "Renewal"], payout: 28.75, cells: { plan: "Optima Secure", si: "10L - 50L", ageBand: "18-55", policy: "Fresh / Renewal", cond: "No pre-policy medicals below 45" } },
      { insurer: "ICICI LOMBARD", si: [500000, 2500000], age: [18, 45], business: ["Port"], payout: 27.25, cells: { plan: "Health AdvantEdge", si: "5L - 25L", ageBand: "18-45", policy: "Port", cond: "Continuity benefits carried over" } },
      { insurer: "RELIANCE HEALTH", si: [500000, 5000000], age: [18, 60], business: ["Fresh", "Renewal"], payout: 26.5, cells: { plan: "Health Infinity", si: "5L - 50L", ageBand: "18-60", policy: "Fresh / Renewal", cond: "Standard grid" } },
      { insurer: "ADITYA BIRLA HEALTH", si: [1000000, 10000000], age: [18, 50], business: ["Fresh"], payout: 26, cells: { plan: "Activ One", si: "10L - 1Cr", ageBand: "18-50", policy: "Fresh", cond: "Wellness loading applies" } },
      { insurer: "CARE HEALTH", si: [2500000, 10000000], age: [18, 55], business: ["Fresh", "Port"], payout: 25.25, cells: { plan: "Care Advantage", si: "25L - 1Cr", ageBand: "18-55", policy: "Fresh / Port", cond: "High sum insured band" } },
      { insurer: "NEW INDIA ASSURANCE", si: [300000, 1500000], age: [18, 65], business: ["Renewal"], payout: 22.5, cells: { plan: "Mediclaim Plus", si: "3L - 15L", ageBand: "18-65", policy: "Renewal", cond: "Standard grid" } },
      { insurer: "STAR HEALTH", si: [500000, 1000000], age: [46, 65], business: ["Renewal", "Port"], payout: 21.75, cells: { plan: "Assure", si: "5L - 10L", ageBand: "46-65", policy: "Renewal / Port", cond: "Senior band, medicals required" } },
      { insurer: "MAGMA HDI HEALTH", si: [500000, 2500000], age: [18, 50], business: ["Fresh"], payout: 20.5, cells: { plan: "OneHealth", si: "5L - 25L", ageBand: "18-50", policy: "Fresh", cond: "Standard grid" } },
    ],
  },
};

const CATEGORY_SUBCATEGORIES = {
  "2w": ["Bike", "Scooter", "Others"],
  gcv: ["3W", "Truck", "Tipper", "Tanker", "Dumper", "Trailer", "Others"],
  pcv: ["3W", "Taxi", "School Bus", "Staff Bus", "Route Bus", "Others"],
  misD: ["Tractor", "Ambulance", "Crane", "JCB", "Loader", "Excavator", "Others"],
};

const INITIAL = { insuranceLine: "Motor", productCategory: "pc", rto: "", policyType: "Package", businessType: "", fuelTypes: [], insurerNames: [], subcategories: [], engineCapacity: "", vehicleWeight: "", vehicleAge: "", seatingCapacity: "", nilDep: "", sumInsured: "", age: "" };

const percent = (value) => `${Number(value.toFixed(2)).toLocaleString("en-IN")}%`;

/** A blank input, a non-numeric input, or a row that carries no range on that field all pass. */
const inRange = (raw, range) => {
  const value = Number(raw);
  return !range || String(raw).trim() === "" || !Number.isFinite(value) || (value >= range[0] && value <= range[1]);
};

const payoutValue = (row, policyType, health) => {
  if (health) return row.payout;
  if (policyType === "SAOD") return row.od;
  if (policyType === "Liability") return row.tp;
  return row.od + row.tp;
};

const payoutLabel = (row, policyType, health) => {
  if (health) return percent(row.payout);
  if (policyType === "SAOD") return `${percent(row.od)} OD`;
  if (policyType === "Liability") return `${percent(row.tp)} TP`;
  return `${percent(row.od)} OD + ${percent(row.tp)} TP`;
};

function SelectField({ label, required, value, options, onChange }) {
  return <label className="cq-field"><span>{label}{required && <b aria-hidden="true">*</b>}</span><span className="cq-select-wrap"><select value={value} required={required} aria-required={required} onChange={(event) => onChange(event.target.value)}><option value="">Select…</option>{options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}</select><ChevronDown size={16} aria-hidden="true" /></span></label>;
}

function MultiSelect({ label, values, options, onChange, hint }) {
  const [open, setOpen] = useState(false);
  const container = useRef(null);
  useEffect(() => {
    const close = (event) => { if (!container.current?.contains(event.target)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  const labelId = `${label.replaceAll(" ", "-").toLowerCase()}-label`;
  const toggle = (option) => onChange(values.includes(option) ? values.filter((item) => item !== option) : [...values, option]);
  return <div className="cq-field cq-multi" ref={container} onKeyDown={(event) => { if (event.key === "Escape") { setOpen(false); event.currentTarget.querySelector(".cq-multi-trigger")?.focus(); } }}><span id={labelId}>{label}</span><button type="button" className="cq-multi-trigger" aria-haspopup="listbox" aria-labelledby={labelId} aria-expanded={open} onClick={() => setOpen(!open)}><span className={values.length ? "" : "cq-placeholder"}>{values.length ? `${values.length} selected` : "Select…"}</span><ChevronDown size={16} aria-hidden="true" /></button>{open && <div className="cq-menu" role="listbox" aria-multiselectable="true"><div className="cq-menu-actions"><button type="button" disabled={values.length === options.length} onClick={() => onChange([...options])}><CheckCheck size={13} /> Select all</button><button type="button" disabled={!values.length} onClick={() => onChange([])}><X size={13} /> Clear</button></div><div className="cq-menu-list">{options.map((option) => <button key={option} type="button" role="option" aria-selected={values.includes(option)} onClick={() => toggle(option)}><span className="cq-checkbox">{values.includes(option) && <Check size={12} />}</span>{option}</button>)}</div></div>}{hint && <p className="cq-hint">{hint}</p>}</div>;
}

function ResultsGrid({ columns, rows, cohort, policyType, health, page, setPage }) {
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const start = safePage * PAGE_SIZE;
  const visible = rows.slice(start, start + PAGE_SIZE);
  return <section className="cq-results" aria-live="polite">
    <p><strong>{cohort}</strong><span> · {rows.length} {rows.length === 1 ? "grid" : "grids"} (sorted by descending payout)</span></p>
    <div className="cq-table-shell"><div className="cq-table-scroll"><table>
      <thead><tr><th className="cq-pin-left">Insurer</th>{columns.map(([key, header]) => <th key={key}>{header}</th>)}<th className="cq-pin-right">Payout</th></tr></thead>
      <tbody>{visible.map((row, index) => <tr key={`${row.insurer}-${start + index}`}>
        <td className="cq-pin-left"><strong>{row.insurer}</strong><small>#{start + index + 1}</small></td>
        {columns.map(([key, , trailing]) => <td key={key}>{row.cells[key] ? <span className={trailing ? "cq-condition" : "cq-value"}>{row.cells[key]}</span> : <span className="cq-blank">—</span>}</td>)}
        <td className="cq-payout cq-pin-right">{payoutLabel(row, policyType, health)}</td>
      </tr>)}</tbody>
    </table></div></div>
    <div className="cq-mobile-results">{visible.map((row, index) => <article key={`${row.insurer}-mobile-${start + index}`}>
      <div><strong>{row.insurer}</strong><span>#{start + index + 1}</span><b>{payoutLabel(row, policyType, health)}</b></div>
      <dl>{columns.filter(([key]) => row.cells[key]).map(([key, header]) => <div key={key}><dt>{header}</dt><dd>{row.cells[key]}</dd></div>)}</dl>
    </article>)}</div>
    {pageCount > 1 && <div className="cq-pager">
      <span>Showing {start + 1}–{Math.min(start + PAGE_SIZE, rows.length)} of {rows.length}</span>
      <div>
        <button type="button" disabled={safePage === 0} onClick={() => setPage(safePage - 1)}>Previous</button>
        <span>Page {safePage + 1} of {pageCount}</span>
        <button type="button" disabled={safePage >= pageCount - 1} onClick={() => setPage(safePage + 1)}>Next</button>
      </div>
    </div>}
  </section>;
}

export default function CommissionQueryPlayground() {
  const [filters, setFilters] = useState(INITIAL);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);

  const health = filters.insuranceLine !== "Motor";
  const rtoValid = /^[A-Z]{2}\d{2}$/.test(filters.rto);
  const scoped = health || (Boolean(filters.productCategory) && Boolean(filters.policyType) && rtoValid);
  const catalog = CATALOG[health ? "health" : filters.productCategory] ?? CATALOG.pc;
  const subcategories = CATEGORY_SUBCATEGORIES[filters.productCategory] ?? [];
  const threeWheeler = filters.subcategories.includes("3W");
  const nonThreeWheeler = filters.subcategories.length === 0 || filters.subcategories.some((item) => item !== "3W");
  const commercialVehicle = ["gcv", "pcv", "misD"].includes(filters.productCategory);
  const showFuelType = filters.productCategory === "pc" || (["gcv", "pcv"].includes(filters.productCategory) && threeWheeler);
  const availablePolicyTypes = commercialVehicle ? POLICY_TYPES.filter(([value]) => value !== "SAOD") : POLICY_TYPES;
  const insurerOptions = useMemo(() => [...new Set(catalog.rows.map((row) => row.insurer))], [catalog]);

  const results = useMemo(() => catalog.rows
    .filter((row) => {
      if (filters.insurerNames.length && !filters.insurerNames.includes(row.insurer)) return false;
      if (filters.subcategories.length && row.sub && !filters.subcategories.includes(row.sub)) return false;
      if (filters.fuelTypes.length && row.fuels && !row.fuels.some((fuel) => filters.fuelTypes.includes(fuel))) return false;
      if (filters.businessType && row.business && !row.business.includes(filters.businessType)) return false;
      if (filters.nilDep && row.nilDep !== undefined && row.nilDep !== (filters.nilDep === "true")) return false;
      return inRange(filters.engineCapacity, row.cc) && inRange(filters.vehicleWeight, row.weight)
        && inRange(filters.vehicleAge, row.vage) && inRange(filters.seatingCapacity, row.seats)
        && inRange(filters.sumInsured, row.si) && inRange(filters.age, row.age);
    })
    .sort((a, b) => payoutValue(b, filters.policyType, health) - payoutValue(a, filters.policyType, health)),
    [catalog, filters, health]);

  useEffect(() => { setPage(0); }, [results]);
  useEffect(() => {
    if (!scoped) return;
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 340);
    return () => clearTimeout(timer);
  }, [filters, scoped]);

  const update = (key, value) => setFilters((current) => ({ ...current, [key]: value }));
  const changeLine = (line) => setFilters({ ...INITIAL, insuranceLine: line, productCategory: line === "Motor" ? "pc" : "", policyType: line === "Motor" ? "Package" : "" });
  const changeCategory = (productCategory) => setFilters((current) => ({ ...current, productCategory, policyType: "Package", subcategories: [], businessType: "", fuelTypes: [], insurerNames: [], nilDep: "", engineCapacity: "", vehicleWeight: "", vehicleAge: "", seatingCapacity: "" }));
  const resetFilters = () => setFilters({ ...INITIAL, insuranceLine: filters.insuranceLine, productCategory: health ? "" : "pc", policyType: health ? "" : "Package" });

  const categoryLabel = PRODUCT_CATEGORIES.find(([value]) => value === filters.productCategory)?.[1];
  const lineLabel = INSURANCE_LINES.find(([value]) => value === filters.insuranceLine)?.[1];
  const cohort = health
    ? `${lineLabel}${filters.businessType ? ` · ${filters.businessType}` : ""}`
    : `${categoryLabel} · ${POLICY_TYPES.find(([value]) => value === filters.policyType)?.[1]} · ${filters.rto}`;
  const insurerHint = filters.insurerNames.length
    ? `${filters.insurerNames.length} of ${insurerOptions.length} insurers selected`
    : `All ${insurerOptions.length} insurers included`;

  return <main className="cq-root">
    <header className="cq-topbar"><a href="/" aria-label="FinLead AI home"><img src="/FinLeadAILogo.png" alt="FinLead AI" /></a><span>Playground</span></header>
    <div className="cq-page">
      <a className="cq-back" href="/"><ArrowLeft size={16} /> Back to website</a>
      <div className="cq-title"><h1>Commission Query</h1><p>Filter the live commission grid by cohort</p></div>
      <section className="cq-filter-card" aria-labelledby="filter-heading">
        <div className="cq-filter-head">
          <div><h2 id="filter-heading">Filters</h2><p>Fields marked <b>*</b> are required before results load.</p></div>
          <button type="button" onClick={resetFilters}><X size={14} aria-hidden="true" /> Clear filters</button>
        </div>
        <div className="cq-fields">
          <SelectField label="Insurance Line" required value={filters.insuranceLine} options={INSURANCE_LINES} onChange={changeLine} />
          {!health && <SelectField label="Product Category" required value={filters.productCategory} options={PRODUCT_CATEGORIES} onChange={changeCategory} />}
          {!health && <label className="cq-field"><span>RTO Code<b>*</b></span><input value={filters.rto} required aria-required="true" maxLength={4} aria-invalid={Boolean(filters.rto) && !rtoValid} placeholder="e.g. GJ01" onChange={(event) => update("rto", event.target.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase())} />{filters.rto && !rtoValid && <small>Enter 2 letters and 2 digits, e.g. GJ01</small>}</label>}
          {!health && <SelectField label="Policy Type" required value={filters.policyType} options={availablePolicyTypes} onChange={(value) => update("policyType", value)} />}
          {!health && subcategories.length > 0 && <MultiSelect label="Product Subcategory" values={filters.subcategories} options={subcategories} onChange={(value) => update("subcategories", value)} />}
          {!health && !commercialVehicle && <SelectField label="Business Type" value={filters.businessType} options={BUSINESS_TYPES} onChange={(value) => update("businessType", value)} />}
          {!health && showFuelType && <MultiSelect label="Fuel Type" values={filters.fuelTypes} options={FUEL_TYPES} onChange={(value) => update("fuelTypes", value)} />}
          {!health && filters.productCategory === "pcv" && nonThreeWheeler && <SelectField label="Nil Dep" value={filters.nilDep} options={[["true", "True"], ["false", "False"]]} onChange={(value) => update("nilDep", value)} />}
          {!health && ["pc", "2w"].includes(filters.productCategory) && <label className="cq-field"><span>Engine Capacity (CC)</span><input type="number" min="0" value={filters.engineCapacity} placeholder="e.g. 1200" onChange={(event) => update("engineCapacity", event.target.value)} /></label>}
          {!health && filters.productCategory === "gcv" && <label className="cq-field"><span>Vehicle Weight (Tonne)</span><input type="number" min="0" step="0.1" value={filters.vehicleWeight} placeholder="e.g. 2.7" onChange={(event) => update("vehicleWeight", event.target.value)} /></label>}
          {!health && filters.productCategory === "gcv" && nonThreeWheeler && <label className="cq-field"><span>Vehicle Age (Years)</span><input type="number" min="0" value={filters.vehicleAge} placeholder="e.g. 3" onChange={(event) => update("vehicleAge", event.target.value)} /></label>}
          {!health && filters.productCategory === "pcv" && <label className="cq-field"><span>Seating Capacity</span><input type="number" min="0" value={filters.seatingCapacity} placeholder="e.g. 5" onChange={(event) => update("seatingCapacity", event.target.value)} /></label>}
          {health && <SelectField label="Policy Type" value={filters.businessType} options={HEALTH_POLICY_TYPES} onChange={(value) => update("businessType", value)} />}
          {health && <label className="cq-field"><span>Sum Insured (₹)</span><input type="number" min="0" value={filters.sumInsured} placeholder="e.g. 500000" onChange={(event) => update("sumInsured", event.target.value)} /></label>}
          {health && <label className="cq-field"><span>Age</span><input type="number" min="0" value={filters.age} placeholder="e.g. 35" onChange={(event) => update("age", event.target.value)} /></label>}
          <MultiSelect label="Insurer" values={filters.insurerNames} options={insurerOptions} onChange={(value) => update("insurerNames", value)} hint={insurerHint} />
        </div>
      </section>
      {!scoped ? <div className="cq-state">Enter a valid RTO code (e.g. GJ01) to load the commission grid.</div>
        : loading ? <div className="cq-state" role="status"><LoaderCircle className="cq-spinner" size={18} /> Loading commission grids…</div>
        : results.length === 0 ? <div className="cq-state">No commission grids found for {cohort}. Widen the filters and try again.</div>
        : <ResultsGrid columns={catalog.columns} rows={results} cohort={cohort} policyType={filters.policyType} health={health} page={page} setPage={setPage} />}
    </div>
  </main>;
}
