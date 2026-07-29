export const posts = [
  {
    slug: "insurance-commission-reconciliation-guide",
    title: "A simple guide to insurance commission reconciliation",
    dek: "How insurance teams can compare carrier statements, expected commissions, and exceptions without turning month-end into chaos.",
    category: "Finance operations",
    published: "2026-07-24",
    updated: "2026-07-24",
    readingTime: 8,
    author: "FinLead Research",
    featured: true,
    keywords: ["commission reconciliation", "carrier statements", "insurance accounting", "revenue leakage"],
    seo: {
      primaryKeyword: "insurance commission reconciliation",
      searchIntent: "informational",
      audience: "Insurance finance and operations teams",
    },
    faqs: [
      {
        question: "What is insurance commission reconciliation?",
        answer: "Insurance commission reconciliation is the process of comparing expected commission from policies and contracts against the commission actually received from carriers, then explaining and resolving every material variance.",
      },
      {
        question: "Why is commission reconciliation difficult for insurance teams?",
        answer: "It becomes difficult when statements, policy events, rate schedules, and producer hierarchies sit across different systems and formats. A team needs line-level matching, controlled exception handling, and a clear audit trail.",
      },
      {
        question: "What should a strong reconciliation workflow measure?",
        answer: "A strong workflow should track value-weighted match quality, unresolved dollars, exception aging, recovery value, close speed, and whether every decision can be traced back to source data and business rules.",
      },
    ],
    content: [
      { type: "lead", text: "Commission reconciliation is more than matching two spreadsheets. It is how an insurance business checks whether it was paid what it expected to earn." },
      { type: "p", text: "This gets messy fast when policy records, endorsements, cancellations, rate tables, producer rules, and carrier statements all live in different places. Even when totals look right, you can still miss a wrong rate, a missing policy, or money booked to the wrong producer." },
      { type: "h2", text: "Start with what you expected to earn" },
      { type: "p", text: "Do not wait for the carrier statement to begin. Build an expected ledger from your source systems at policy and transaction level. Each row should show the carrier, policy, product, effective date, premium basis, expected rate, expected commission, producer, and reporting period." },
      { type: "bullets", items: ["Normalize policy and endorsement identifiers before matching.", "Version rate tables so every calculation can be reproduced.", "Keep original source values alongside transformed values.", "Separate true cash timing differences from economic variances."] },
      { type: "h2", text: "Use a few matching steps, not one rigid rule" },
      { type: "p", text: "A good matching process starts with exact matches and then moves to careful fallback rules. First match on policy and transaction IDs. After that, use combinations like carrier, insured, effective date, product, and amount ranges. If something still does not match, keep it visible as an exception instead of forcing a bad match." },
      { type: "callout", title: "A simple rule to follow", text: "Automate the clear cases. Send the messy ones to people with the right evidence already attached." },
      { type: "h2", text: "Make the exception queue easy to work through" },
      { type: "p", text: "An exception only helps if it tells someone what to do next. Group issues by cause such as missing statement line, wrong rate, duplicate payment, withholding, cancellation timing, or unknown policy. Show the expected amount, the received amount, and who owns the next step." },
      { type: "h2", text: "Measure the full close, not just the match rate" },
      { type: "p", text: "Match rate is useful, but it can hide poor automatic matches. Track value-weighted reconciliation, unresolved dollars, exception age, recovery value, time to close, and how many decisions have a full audit trail. Those measures tell you if the process is getting better, not just faster." },
      { type: "p", text: "FinLead’s finance-operations agents continuously ingest statements, calculate expected amounts, explain variances, and preserve the audit trail. The outcome is not another dashboard to monitor; it is a reconciled book with the uncertain work routed to the right person." },
    ],
  },
  {
    slug: "ai-agents-insurance-back-office",
    title: "How AI agents actually help in insurance operations",
    dek: "What makes an AI agent useful in the insurance back office, and how that is different from a tool that only gives answers.",
    category: "AI agents",
    published: "2026-07-16",
    updated: "2026-07-16",
    readingTime: 7,
    author: "FinLead Research",
    keywords: ["insurance AI agents", "back-office automation", "human in the loop", "operational AI"],
    seo: {
      primaryKeyword: "insurance AI agents",
      searchIntent: "informational",
      audience: "Insurance operations leaders evaluating automation",
    },
    faqs: [
      {
        question: "What is an insurance AI agent?",
        answer: "An insurance AI agent is a system that can observe operational work, apply business rules, take controlled actions, and document outcomes across insurance workflows rather than only generate text responses.",
      },
      {
        question: "Where do AI agents fit best in the insurance back office?",
        answer: "They fit best in workflows with clear triggers, defined evidence, bounded actions, and auditable outcomes, such as reconciliation, statement extraction, producer onboarding, payout calculation, and bordereaux processing.",
      },
      {
        question: "How should teams govern AI agents in insurance operations?",
        answer: "Teams should define what evidence an agent can use, what actions it may take, when a human must review exceptions, and how each decision is logged and reversed if needed.",
      },
    ],
    content: [
      { type: "lead", text: "A good insurance AI agent does more than talk. It helps get real work done, follows rules, works across systems, and shows what happened." },
      { type: "p", text: "That matters in insurance. A polished answer cannot close a reconciliation, verify a producer, update a record, or prepare an audit trail on its own. The real value shows up when a system can move a piece of work from intake to a clear result." },
      { type: "h2", text: "Start with work that has a clear finish" },
      { type: "p", text: "The best first use cases have a clear trigger, repeatable evidence, limited actions, and an easy-to-check result. Commission reconciliation, statement extraction, payout calculation, producer onboarding, and bordereaux processing are good examples because teams already know what done and correct should look like." },
      { type: "bullets", items: ["Inputs can be traced to a source document or system.", "Business rules can be stated and tested.", "Exceptions can be routed to a named owner.", "The finished work can be independently audited."] },
      { type: "h2", text: "Set clear boundaries for what the agent can do" },
      { type: "p", text: "Give the agent more freedom only when the evidence supports it. Start with collecting data, classifying documents, doing calculations, and making recommendations. Allow low-risk actions when confidence is high and rules are clear. Keep human review for bigger, unusual, or policy-sensitive decisions. Every step should be written down in plain language." },
      { type: "callout", title: "A better question to ask", text: "Instead of asking if AI can do the task, ask what evidence it needs, what actions it can take, and how a reviewer can approve or undo the result." },
      { type: "h2", text: "Work with the systems you already have" },
      { type: "p", text: "Most teams do not need to replace their core systems. An agent layer can connect through APIs and controlled backend integrations, then work across policy systems, accounting tools, CRM, document stores, and internal software. That lowers migration risk and lets the business improve one workflow at a time." },
      { type: "h2", text: "Pay for the result, not just another tool" },
      { type: "p", text: "Traditional software often gives teams one more screen to manage. Outcome-based agents should be measured by finished work: statements processed, books reconciled, producers activated, exceptions resolved, or leakage recovered. The pricing model should reflect that." },
    ],
  },
  {
    slug: "producer-onboarding-operating-model",
    title: "How to make producer onboarding faster",
    dek: "A simpler way to reduce delays in identity checks, licensing, agreements, and activation without losing control.",
    category: "Distribution",
    published: "2026-07-08",
    updated: "2026-07-08",
    readingTime: 6,
    author: "FinLead Research",
    keywords: ["producer onboarding", "license verification", "insurance distribution", "agent activation"],
    seo: {
      primaryKeyword: "producer onboarding",
      searchIntent: "informational",
      audience: "Insurance distribution, compliance, and operations teams",
    },
    faqs: [
      {
        question: "What slows producer onboarding in insurance?",
        answer: "Most delays come from handoffs between intake, identity checks, licensing, agreements, appointments, and activation rather than from one single difficult verification step.",
      },
      {
        question: "How can insurers reduce producer onboarding cycle time?",
        answer: "They can reduce cycle time by treating each producer as a case, running independent checks in parallel, validating fields at intake, and escalating only the exact failed condition with supporting evidence.",
      },
      {
        question: "What should producer onboarding teams measure?",
        answer: "They should measure median and tail completion time, time in stage, first-pass completion, rework rate, exception mix, and abandonment across channels, jurisdictions, and products.",
      },
    ],
    content: [
      { type: "lead", text: "Producer onboarding may look like admin work, but it directly affects revenue. Every extra day between application and activation slows down distribution." },
      { type: "p", text: "Most delays do not come from one hard check. They build up across document collection, identity verification, licensing, appointments, agreements, and system activation. The fix is a case-based workflow that keeps the evidence and next steps in one place." },
      { type: "h2", text: "Treat each producer like one case" },
      { type: "p", text: "A shared checklist is not enough. Each producer should have one case that holds documents, extracted fields, verification results, approvals, exceptions, messages, and current stage. That case becomes the shared source of truth across recruiting, compliance, and operations." },
      { type: "h2", text: "Run the checks that can happen at the same time" },
      { type: "p", text: "Identity checks, document completeness, and license checks often do not depend on one another. Running them together cuts cycle time. Steps like appointment or activation should start as soon as the exact prerequisites are done, not wait for a weekly batch review." },
      { type: "bullets", items: ["Validate fields at intake instead of after submission.", "Explain missing or inconsistent evidence in one request.", "Record the registry and timestamp behind every verification.", "Escalate only the failed condition, not the entire case."] },
      { type: "callout", title: "What good looks like", text: "Clean cases should move straight through. Everything else should land in a clear queue with the right evidence attached." },
      { type: "h2", text: "Track where time is really being lost" },
      { type: "p", text: "Average onboarding time hides too much. Measure median completion time, long-tail delays, time spent in each stage, first-pass completion, rework, exception mix, and abandonment. Break the numbers down by channel, jurisdiction, product, and source to see where friction keeps showing up." },
      { type: "p", text: "FinLead’s distribution agents coordinate the full path from document and identity verification through licensing, agreements, and activation while keeping a human reviewer in control of exceptions." },
    ],
  },
  {
    slug: "insurance-revenue-leakage-signals",
    title: "Seven signs you may have revenue leakage",
    dek: "Simple warning signs that can help insurance teams spot missed commission, rate issues, and margin drift earlier.",
    category: "Intelligence",
    published: "2026-06-27",
    updated: "2026-06-27",
    readingTime: 7,
    author: "FinLead Research",
    keywords: ["insurance revenue leakage", "profitability intelligence", "commission variance", "insurance analytics"],
    seo: {
      primaryKeyword: "insurance revenue leakage",
      searchIntent: "informational",
      audience: "Insurance finance, analytics, and profitability teams",
    },
    faqs: [
      {
        question: "What is insurance revenue leakage?",
        answer: "Insurance revenue leakage is the loss of expected economic value through missed commission, rate drift, duplicate payments, uncollected adjustments, or unresolved operational errors that reduce profitability over time.",
      },
      {
        question: "How can teams detect revenue leakage earlier?",
        answer: "Teams can detect it earlier by continuously monitoring line-level signals such as rate drift, missing statement lines, duplicate characteristics, unexplained fees, payout imbalance, and margin deterioration by cohort.",
      },
      {
        question: "Is every variance a revenue leakage issue?",
        answer: "No. Some variances come from timing, thresholds, contingent terms, or legitimate adjustments. The right process connects each signal to contract terms, policy events, and historical context before deciding the cause.",
      },
    ],
    content: [
      { type: "lead", text: "Revenue leakage usually does not show up as one big mistake. It shows up as a pattern of small mismatches that stay hidden because no one system sees the full picture." },
      { type: "p", text: "The real question is not just whether cash matched a statement. It is whether the economics matched the agreement, the policy event, and the distribution setup you expected." },
      { type: "h2", text: "Signs worth watching all the time" },
      { type: "bullets", items: ["Paid commission rates drift from the contracted schedule.", "Expected policies repeatedly fail to appear on carrier statements.", "Duplicate lines share policy, period, and transaction characteristics.", "Endorsements and cancellations create one-sided adjustments.", "Withholding or fees change without a corresponding rule or notice.", "Producer payouts exceed the economics received from the carrier.", "A product, carrier, or cohort shows persistent margin deterioration."] },
      { type: "h2", text: "Look at the context before calling it leakage" },
      { type: "p", text: "Not every variance is leakage. Timing, minimum thresholds, contingent commissions, and valid adjustments can all explain a difference. Before you label the cause, bring together transaction history, contract terms, rate versions, and policy events." },
      { type: "callout", title: "Focus on what you can recover", text: "The biggest variance is not always the best one to chase first. Rank issues by confidence, value, age, contract window, and effort to recover." },
      { type: "h2", text: "Use what you find to improve the process" },
      { type: "p", text: "Recovered value is only part of the story. A strong process also fixes bad reference data, updates rules, improves upstream controls, and checks whether the same root cause shows up again. The goal is to reduce future exceptions, not just build a longer list." },
      { type: "p", text: "FinLead combines line-level operational data with agent-led investigation so finance teams can move from periodic sampling to continuous, explained leakage detection." },
    ],
  },
  {
    slug: "bordereaux-processing-control-guide",
    title: "How to make bordereaux processing less painful",
    dek: "A practical way to handle messy files, validate records, and fix exceptions without the usual month-end rush.",
    category: "Data operations",
    published: "2026-06-12",
    updated: "2026-06-12",
    readingTime: 6,
    author: "FinLead Research",
    keywords: ["bordereaux processing", "insurance data extraction", "MGA operations", "data validation"],
    seo: {
      primaryKeyword: "bordereaux processing",
      searchIntent: "informational",
      audience: "MGA, delegated authority, and insurance data operations teams",
    },
    faqs: [
      {
        question: "What is bordereaux processing?",
        answer: "Bordereaux processing is the workflow of ingesting insurer, broker, or MGA bordereaux files, extracting records, validating them, mapping them into a standard model, and resolving exceptions before downstream use.",
      },
      {
        question: "Why is bordereaux processing so manual?",
        answer: "It is manual because file layouts, labels, currencies, and corrections vary by partner and period, which breaks brittle templates and forces teams to repeatedly inspect, remap, and validate submissions.",
      },
      {
        question: "What controls matter most in bordereaux processing?",
        answer: "The most important controls are source preservation, extraction-versus-interpretation separation, multi-level validation, exception context, file versioning, and the ability to replay corrected submissions safely.",
      },
    ],
    content: [
      { type: "lead", text: "Bordereaux processing gets expensive when every new file feels like a brand-new project. What helps is not one perfect template, but a process that can handle variation without falling apart." },
      { type: "p", text: "Files change by partner, product, country, and month. Columns move, labels change, currencies differ, and corrections often arrive later. A dependable process keeps the original file safe while turning each row into a common working format." },
      { type: "h2", text: "First read the file, then decide what it means" },
      { type: "p", text: "Start by identifying sheets, headers, tables, and raw values. After that, map those values into standard fields. Keeping those steps separate makes it much easier to see whether an error came from reading the file or from interpreting it the wrong way." },
      { type: "h2", text: "Check the data at three levels" },
      { type: "bullets", items: ["Field level: type, format, allowed values, and required data.", "Record level: relationships such as dates, premiums, limits, and commission.", "Portfolio level: totals, duplicates, period movement, and unusual distribution shifts."] },
      { type: "callout", title: "Keep the trail back to the source", text: "Every cleaned-up value should still point back to the original file, sheet, row, and cell it came from." },
      { type: "h2", text: "Review exceptions with the full context" },
      { type: "p", text: "When someone reviews an exception, they should see the failed rule, the original row, related history, and the suggested correction together. Approved fixes can improve future mappings, while unusual changes can still go through review." },
      { type: "h2", text: "Plan for corrections and reruns" },
      { type: "p", text: "Late files and restatements are normal. Keep file versions, use idempotent processing, and make downstream effects easy to reproduce. When a corrected file arrives, it should update the right records without duplicating work that already cleared." },
      { type: "p", text: "With an agent handling recognition, mapping, validation, and exception assembly, operations teams can focus on the genuinely unusual cases rather than reformatting routine files." },
    ],
  },
];

export const categories = [...new Set(posts.map((post) => post.category))];
export const keywords = [...new Set(posts.flatMap((post) => post.keywords))].sort();

export function getPost(slug) {
  return posts.find((post) => post.slug === slug);
}

export const postTemplate = {
  seo: {
    primaryKeyword: "one primary keyword phrase",
    searchIntent: "informational",
    audience: "specific insurance team or buyer",
  },
  faqs: [
    {
      question: "What is [topic]?",
      answer: "Define the topic in plain language and anchor it in a real insurance workflow.",
    },
    {
      question: "Why does [topic] matter?",
      answer: "Explain the operational or financial consequence with specificity.",
    },
    {
      question: "How should a team improve [topic]?",
      answer: "Summarize the practical framework or control model described in the article.",
    },
  ],
};

export function formatPostDate(value) {
  return new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}
