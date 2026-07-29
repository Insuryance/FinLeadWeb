"use client";

import { useState } from "react";
import { Check, Link as LinkIcon } from "lucide-react";

export default function ShareBar() {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    const url = window.location.href;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="bl-share">
      <button type="button" onClick={copyLink}>
        {copied ? <Check size={15} /> : <LinkIcon size={15} />}
        {copied ? "Link copied" : "Share link"}
      </button>
    </div>
  );
}
