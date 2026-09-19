"use client";

import { useState } from "react";
import { Copy, Check, Download, FileText, Scale, ShieldCheck, Printer } from "lucide-react";

interface NoticeViewerProps {
  tier1Text: string;
  tier2Text: string;
  claimId: string;
}

export default function NoticeViewer({ tier1Text, tier2Text, claimId }: NoticeViewerProps) {
  const [activeTab, setActiveTab] = useState<"tier1" | "tier2">("tier1");
  const [copied, setCopied] = useState(false);

  const currentContent = activeTab === "tier1" ? tier1Text : tier2Text;
  const currentTitle =
    activeTab === "tier1"
      ? "Tier 1: Relationship-Preserving Settlement Notice"
      : "Tier 2: Statutory Demand Notice (Sections 15 & 16)";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([currentContent], { type: "text/plain;charset=utf-8" });
    element.href = URL.createObjectURL(file);
    element.download = `${claimId}_${activeTab.toUpperCase()}_NOTICE.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${currentTitle} - ${claimId}</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #111; line-height: 1.6; }
              pre { white-space: pre-wrap; font-family: monospace; font-size: 13px; background: #f8fafc; padding: 24px; border: 1px solid #cbd5e1; border-radius: 8px; }
              h1 { font-size: 20px; margin-bottom: 20px; border-bottom: 2px solid #ff9900; padding-bottom: 8px; }
            </style>
          </head>
          <body>
            <h1>${currentTitle} (Ref: ${claimId})</h1>
            <pre>${currentContent}</pre>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  };

  return (
    <div className="bg-[#1e293b] border border-slate-700/80 rounded-2xl shadow-xl overflow-hidden flex flex-col">
      {/* Header & Tab Selector */}
      <div className="border-b border-slate-700/80 bg-slate-900/60 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-[#ff9900] uppercase tracking-wider">
            Autonomous Communication Engine
          </span>
          <h3 className="text-lg font-bold text-white flex items-center gap-2 mt-0.5">
            <FileText className="w-5 h-5 text-[#ff9900]" />
            Generated Multi-Tier Notices
          </h3>
        </div>

        {/* Tab Toggle Buttons */}
        <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab("tier1")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "tier1"
                ? "bg-slate-800 text-[#ff9900] shadow-sm border border-[#ff9900]/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <HandshakeIcon className="w-3.5 h-3.5" />
            <span>Tier 1: Amicable Offer</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("tier2")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "tier2"
                ? "bg-slate-800 text-rose-400 shadow-sm border border-rose-500/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Tier 2: Statutory Notice</span>
          </button>
        </div>
      </div>

      {/* Notice Banner */}
      <div
        className={`px-5 py-3 text-xs border-b font-medium flex items-center justify-between ${
          activeTab === "tier1"
            ? "bg-emerald-950/40 border-emerald-500/20 text-emerald-300"
            : "bg-rose-950/40 border-rose-500/20 text-rose-300"
        }`}
      >
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4" />
          <span>
            {activeTab === "tier1"
              ? "Commercial tone: Offers 5% early discount waiver on statutory interest within 48 hours."
              : "Strict legal register: Formally invokes Section 15 & 16 with mandatory 15-day cure notice."}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-600/60 transition"
            title="Copy to Clipboard"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-600/60 transition"
            title="Download Notice"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-600/60 transition"
            title="Print Notice"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Notice Content Viewer */}
      <div className="p-5 flex-1 bg-slate-950/50">
        <pre className="text-xs sm:text-sm font-mono text-slate-300 leading-relaxed whitespace-pre-wrap select-all bg-slate-900/90 p-5 rounded-xl border border-slate-800/80 max-h-[460px] overflow-y-auto">
          {currentContent}
        </pre>
      </div>
    </div>
  );
}

function HandshakeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m11 17 2 2a1 1 0 0 0 1.4 0l4.3-4.3a1 1 0 0 0 0-1.4l-2-2" />
      <path d="m14 14 2.5-2.5a1 1 0 0 0 0-1.4l-2.6-2.6a1 1 0 0 0-1.4 0L10 10" />
      <path d="m3 14 3-3a1 1 0 0 1 1.4 0l2.6 2.6a1 1 0 0 1 0 1.4L7 18a1 1 0 0 1-1.4 0L3 15.4a1 1 0 0 1 0-1.4Z" />
    </svg>
  );
}
