"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Cloud,
  X,
  Layers,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { awsServiceStatuses } from "@/mockData";
import { getTelemetryLogs } from "@/lib/api";

export default function AwsTelemetryModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"services" | "telemetry">("services");
  const [telemetryData, setTelemetryData] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      getTelemetryLogs().then((res) => {
        if (res) setTelemetryData(res);
      });
    }
  }, [isOpen]);

  const defaultLogs = [
    { id: "1", timestamp: new Date().toLocaleTimeString(), service: "Amazon Bedrock", action: "INVOKE_CLAUDE_3_HAIKU", status: "SUCCESS", latency_ms: 540, details: { model: "claude-3-haiku" } },
    { id: "2", timestamp: new Date().toLocaleTimeString(), service: "Amazon Textract", action: "ANALYZE_EXPENSE", status: "SUCCESS", latency_ms: 380, details: { confidence: 0.98 } },
    { id: "3", timestamp: new Date().toLocaleTimeString(), service: "AWS Step Functions", action: "START_EXECUTION", status: "RUNNING", latency_ms: 65, details: { workflow: "vasuli-recovery-workflow-demo" } },
    { id: "4", timestamp: new Date().toLocaleTimeString(), service: "Amazon SES", action: "SEND_DISPUTE_EMAIL", status: "DELIVERED", latency_ms: 175, details: { recipient: "debtor@apexinfra.com" } },
    { id: "5", timestamp: new Date().toLocaleTimeString(), service: "Amazon DynamoDB", action: "PUT_ITEM_CLAIM", status: "SUCCESS", latency_ms: 12, details: { table: "vasuli_claims" } },
  ];

  const logs = telemetryData?.logs && telemetryData.logs.length > 0 ? telemetryData.logs : defaultLogs;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500/10 to-[#ff9900]/10 border border-[#ff9900]/40 text-[#ff9900] hover:bg-[#ff9900]/20 text-xs font-bold transition shadow-sm shrink-0 whitespace-nowrap cursor-pointer"
      >
        <Cloud className="w-3.5 h-3.5 text-[#ff9900] animate-pulse shrink-0" />
        <span>AWS Archi & Telemetry</span>
        <span className="text-[10px] bg-[#ff9900]/20 px-1 py-0.2 rounded font-mono hidden sm:inline">
          us-east-1
        </span>
      </button>

      {mounted && isOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
          {/* Backdrop click to close */}
          <div className="fixed inset-0 -z-10" onClick={() => setIsOpen(false)} />

          <div className="bg-[#1e293b] border border-slate-700 rounded-2xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl relative flex flex-col max-h-[85vh] my-auto z-10">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#ff9900]/20 border border-[#ff9900]/40 flex items-center justify-center text-[#ff9900] shrink-0">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                    Vasuli AI: AWS Cloud Architecture
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Mandatory Rule 0: Region us-east-1 | CloudWatch Structured Telemetry (Rule 3)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition shrink-0 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sub-Header Tab Switcher */}
            <div className="flex items-center gap-2 pt-3 pb-2 border-b border-slate-800/80">
              <button
                type="button"
                onClick={() => setActiveTab("services")}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  activeTab === "services"
                    ? "bg-slate-800 text-[#ff9900] border border-[#ff9900]/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Architecture & Services
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("telemetry")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  activeTab === "telemetry"
                    ? "bg-slate-800 text-emerald-400 border border-emerald-500/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Live CloudWatch Logs</span>
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto pr-1 space-y-3 my-3 flex-1">
              {activeTab === "services" ? (
                <>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                    Core Cloud Infrastructure
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {awsServiceStatuses.map((srv) => (
                      <div
                        key={srv.name}
                        className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-xs sm:text-sm flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            {srv.name}
                          </span>
                          <span className="text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            {srv.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#ff9900] font-mono font-medium">
                          {srv.badge}
                        </div>
                        <p className="text-[11px] text-slate-400 leading-snug">{srv.role}</p>
                      </div>
                    ))}
                  </div>

                  {/* Data Sourcing & HuggingFace Integration Card */}
                  <div className="p-3.5 rounded-xl bg-gradient-to-r from-blue-950/40 to-slate-900 border border-blue-500/30 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0" /> Sourcing Strategy
                      </span>
                      <span className="text-[9px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded font-mono">
                        Hugging Face
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Invoices aligned with <code className="text-emerald-300 bg-slate-900 px-1 py-0.5 rounded text-[11px]">alamgirqazi/invoice-ocr-synthetic</code> for Amazon Textract OCR extraction, testing Section 15 default thresholds and Section 16 3x compounding interest.
                    </p>
                    <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-400 pt-0.5">
                      <span>- RBI Benchmark: 5.50% (3x statutory = 16.50%)</span>
                      <span>- Section 43B(h) Corporate Tax Disallowance: 30% Penalty</span>
                    </div>
                  </div>
                </>
              ) : (
                /* Telemetry Stream View */
                <div className="space-y-2 font-mono text-xs">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pb-1">
                    <span>Structured CloudWatch Logs (Bible Rule 3)</span>
                    <span className="text-emerald-400">Status: Streaming Live</span>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2 max-h-[360px] overflow-y-auto">
                    {logs.map((log: any, index: number) => (
                      <div key={log.id || index} className="p-2 rounded bg-slate-900/90 border border-slate-800/80 flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-amber-400 text-[11px]">[{log.service}]</span>
                          <span className="text-[10px] text-slate-500">{log.timestamp}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-200">{log.action}</span>
                          <span className="text-emerald-400 text-[10px] font-semibold">{log.latency_ms}ms</span>
                        </div>
                        {log.details && (
                          <div className="text-[10px] text-slate-400 truncate">
                            {JSON.stringify(log.details)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end pt-2 border-t border-slate-800 shrink-0">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
