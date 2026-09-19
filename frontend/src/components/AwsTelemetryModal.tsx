"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Cloud,
  X,
  Layers,
  Sparkles,
  CheckCircle2,
  Terminal,
  Activity,
  RefreshCw,
  Cpu,
  Clock,
  Check,
} from "lucide-react";
import { awsServiceStatuses } from "@/mockData";
import { fetchTelemetryLogs } from "@/lib/api";

interface TelemetryLog {
  service: string;
  action: string;
  latency_ms: number;
  status: string;
  timestamp?: string;
  details?: Record<string, any>;
}

export default function AwsTelemetryModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"architecture" | "telemetry">("architecture");
  const [logs, setLogs] = useState<TelemetryLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [expandedLogIdx, setExpandedLogIdx] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen && activeTab === "telemetry") {
      loadLogs();
    }
  }, [isOpen, activeTab]);

  const loadLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const data = await fetchTelemetryLogs();
      const enriched = data.map((log, idx) => ({
        ...log,
        timestamp: log.timestamp || new Date(Date.now() - (data.length - idx) * 12000).toLocaleTimeString(),
      }));
      setLogs(enriched);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const addSimulatedEvent = () => {
    const services = [
      {
        service: "Amazon Bedrock",
        action: "INVOKE_MODEL_TITAN_REASONING",
        latency_ms: 540,
        status: "SUCCESS",
        details: { model: "amazon.titan-text-express-v1", tokens: 412, sentiment: "DEFLECTIVE" },
      },
      {
        service: "Amazon DynamoDB",
        action: "UPDATE_ITEM_AUDIT_LOG",
        latency_ms: 18,
        status: "COMMITTED",
        details: { table: "vasuli_audit_logs", event: "WA_LINK_GENERATED", ttl: 1209600 },
      },
      {
        service: "AWS Step Functions",
        action: "TRANSITION_STATE_WAIT_FOR_SETTLEMENT",
        latency_ms: 32,
        status: "WAITING_CURE_PERIOD",
        details: { cure_days_remaining: 14, next_escalation: "MSEFC_SECTION_18_DRAFT" },
      },
      {
        service: "Amazon SES",
        action: "EMAIL_DELIVERY_NOTIFICATION",
        latency_ms: 110,
        status: "DELIVERED",
        details: { recipient: "accounts@apexinfra.com", response_code: "250 Ok" },
      },
    ];

    const pick = services[Math.floor(Math.random() * services.length)];
    const newEntry: TelemetryLog = {
      ...pick,
      timestamp: new Date().toLocaleTimeString(),
    };
    setLogs((prev) => [newEntry, ...prev]);
  };

  const getLatencyColor = (ms: number) => {
    if (ms < 50) return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
    if (ms < 400) return "text-amber-400 bg-amber-500/10 border-amber-500/30";
    return "text-purple-400 bg-purple-500/10 border-purple-500/30";
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500/10 to-[#ff9900]/10 border border-[#ff9900]/40 text-[#ff9900] hover:bg-[#ff9900]/20 text-xs font-bold transition shadow-sm shrink-0 whitespace-nowrap cursor-pointer"
      >
        <Cloud className="w-3.5 h-3.5 text-[#ff9900] animate-pulse shrink-0" />
        <span>AWS Archi</span>
        <span className="text-[10px] bg-[#ff9900]/20 px-1 py-0.2 rounded font-mono hidden sm:inline">
          us-east-1
        </span>
      </button>

      {mounted && isOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
          {/* Backdrop click to close */}
          <div className="fixed inset-0 -z-10" onClick={() => setIsOpen(false)} />

          <div className="bg-[#1e293b] border border-slate-700 rounded-2xl max-w-3xl w-full p-4 sm:p-6 shadow-2xl relative flex flex-col max-h-[88vh] my-auto z-10">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#ff9900]/20 border border-[#ff9900]/40 flex items-center justify-center text-[#ff9900] shrink-0">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                    Vasuli AI: AWS Serverless Architecture
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Mandatory Rule 0: Region us-east-1 (N. Virginia)
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

            {/* Tab Navigation */}
            <div className="flex items-center gap-2 pt-3 border-b border-slate-800 shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab("architecture")}
                className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "architecture"
                    ? "border-[#ff9900] text-[#ff9900]"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Cloud Stack (6 Services)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("telemetry")}
                className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "telemetry"
                    ? "border-[#ff9900] text-[#ff9900]"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>Live CloudWatch Telemetry</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-1" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto pr-1 space-y-4 my-3 flex-1">
              {activeTab === "architecture" ? (
                <>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                    Core Cloud Infrastructure (CDK Provisioned)
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
                      <span>• RBI Benchmark: 6.75% (3x statutory = 20.25%)</span>
                      <span>• Statutory Grace Limit: 45 Days</span>
                      <span>• Sec 43B(h): 30% Corporate Tax Disallowance</span>
                    </div>
                  </div>
                </>
              ) : (
                /* Tab 2: Live CloudWatch Telemetry */
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        <span className="text-xs font-bold text-white font-mono">
                          /aws/lambda/vasuli-api-handler
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Live execution telemetry captured from Lambda, Step Functions &amp; Bedrock in us-east-1.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={addSimulatedEvent}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                      >
                        <Activity className="w-3 h-3" />
                        <span>Simulate Event</span>
                      </button>
                      <button
                        type="button"
                        onClick={loadLogs}
                        disabled={isLoadingLogs}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                        title="Refresh Logs"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLogs ? "animate-spin text-[#ff9900]" : ""}`} />
                      </button>
                    </div>
                  </div>

                  {/* Log stream items */}
                  <div className="space-y-2">
                    {logs.map((log, idx) => (
                      <div
                        key={idx}
                        onClick={() => setExpandedLogIdx(expandedLogIdx === idx ? null : idx)}
                        className="p-3 rounded-xl bg-slate-900/90 border border-slate-800/80 hover:border-slate-700 transition space-y-2 cursor-pointer"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                              {log.timestamp}
                            </span>
                            <span className="text-xs font-bold text-[#ff9900] flex items-center gap-1">
                              <Cpu className="w-3 h-3 text-[#ff9900]" />
                              {log.service}
                            </span>
                            <span className="text-xs font-mono font-semibold text-slate-200">
                              {log.action}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${getLatencyColor(log.latency_ms)}`}>
                              {log.latency_ms} ms
                            </span>
                            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                              {log.status}
                            </span>
                          </div>
                        </div>

                        {/* Details snippet or expanded view */}
                        {log.details && (
                          <div className="text-[11px] font-mono text-slate-400 bg-slate-950/80 p-2 rounded border border-slate-800/60 overflow-x-auto">
                            {expandedLogIdx === idx ? (
                              <pre className="text-emerald-400 whitespace-pre-wrap">
                                {JSON.stringify(log.details, null, 2)}
                              </pre>
                            ) : (
                              <div className="truncate text-slate-400">
                                {Object.entries(log.details)
                                  .map(([k, v]) => `${k}: ${v}`)
                                  .join("  |  ")}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center pt-2 border-t border-slate-800 shrink-0">
              <span className="text-[11px] text-slate-400 font-mono">
                AWS CDK Stack: <code className="text-[#ff9900]">VasuliStack-Prod</code>
              </span>
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
