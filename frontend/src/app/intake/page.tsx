"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  UploadCloud,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Building2,
  Calendar,
  MessageSquare,
  ShieldCheck,
  Zap,
  Check,
  Paperclip,
  Clock,
  ArrowRight,
  Info,
} from "lucide-react";
import LoadingOverlay from "@/components/LoadingOverlay";
import { auditClaim } from "@/lib/api";
import { sampleCases } from "@/mockData";

export default function IntakePage() {
  const router = useRouter();

  // Form State
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [invoiceFileName, setInvoiceFileName] = useState<string>("INV-2024-089_ApexInfra.pdf");
  const [invoiceFileSize, setInvoiceFileSize] = useState<string>("248 KB");
  const [invoiceDragOver, setInvoiceDragOver] = useState(false);

  const [challanFile, setChallanFile] = useState<File | null>(null);
  const [challanFileName, setChallanFileName] = useState<string>("Signed_Delivery_Challan_DC-882.jpg");
  const [challanFileSize, setChallanFileSize] = useState<string>("1.2 MB");
  const [challanDragOver, setChallanDragOver] = useState(false);

  const [noPodChecked, setNoPodChecked] = useState(false);
  const [udyamNumber, setUdyamNumber] = useState("UDYAM-MH-01-0012345");
  const [buyerName, setBuyerName] = useState("Apex Infrastructure Ltd");
  const [buyerGstin, setBuyerGstin] = useState("07AAAAA0000A1Z5");
  const [chatText, setChatText] = useState(
    "Sir our quarterly statutory audit is ongoing, director is traveling. Payment will be released once accounts department completes verification."
  );

  // Quick scenario selection indicator
  const [selectedCaseIdx, setSelectedCaseIdx] = useState<number>(0);
  const [flashEffect, setFlashEffect] = useState(false);

  // Overlay state
  const [isLoading, setIsLoading] = useState(false);

  // File Inputs Refs
  const invoiceInputRef = useRef<HTMLInputElement>(null);
  const challanInputRef = useRef<HTMLInputElement>(null);

  const demoScenarios = [
    {
      badge: "🟢 Case 1: Happy Path",
      tag: "₹2.5L Overdue • 72 Days",
      buyer: "Apex Infrastructure Ltd",
      gstin: "07AAAAA0000A1Z5",
      inv: "INV-2024-089_ApexInfra.pdf",
      excuse: "Sir our quarterly statutory audit is ongoing, director is traveling. Payment will be released once accounts department completes verification.",
      hasPod: true,
    },
    {
      badge: "🟡 Case 2: Missing POD",
      tag: "Section 15 Risk • 50 Days",
      buyer: "Metro Infra Logistics Ltd",
      gstin: "06CCCCC2222C1Z8",
      inv: "INV-2024-112_MetroLogistics.pdf",
      excuse: "We need to re-verify if all parts were received at the site. Stores team hasn't stamped delivery.",
      hasPod: false,
    },
    {
      badge: "🔴 Case 3: Severe Default",
      tag: "₹5.8L Overdue • 120 Days",
      buyer: "Zenith Mills Pvt Ltd",
      gstin: "29BBBBB1111B1Z2",
      inv: "INV-2024-041_ZenithMills.pdf",
      excuse: "Management has not approved the budget due to acute liquidity crisis. We need another 60 days.",
      hasPod: true,
    },
  ];

  const handleSelectScenario = (index: number) => {
    setSelectedCaseIdx(index);
    const c = demoScenarios[index];
    setBuyerName(c.buyer);
    setBuyerGstin(c.gstin);
    setChatText(c.excuse);
    setInvoiceFileName(c.inv);
    setInvoiceFileSize("280 KB");

    if (!c.hasPod) {
      setNoPodChecked(true);
      setChallanFile(null);
      setChallanFileName("");
    } else {
      setNoPodChecked(false);
      setChallanFileName("Signed_Delivery_Challan_DC-882.jpg");
      setChallanFileSize("1.2 MB");
    }

    setFlashEffect(true);
    setTimeout(() => setFlashEffect(false), 600);
  };

  const handleInvoiceDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setInvoiceDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setInvoiceFile(file);
      setInvoiceFileName(file.name);
      setInvoiceFileSize(`${Math.round(file.size / 1024)} KB`);
    }
  };

  const handleChallanDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setChallanDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setChallanFile(file);
      setChallanFileName(file.name);
      setChallanFileSize(`${Math.round(file.size / 1024)} KB`);
      setNoPodChecked(false);
    }
  };

  const handleAuditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData();
    if (invoiceFile) formData.append("invoice", invoiceFile);
    if (challanFile && !noPodChecked) formData.append("challan", challanFile);
    formData.append("chat_text", chatText);
    formData.append("udyam", udyamNumber);
    formData.append("buyer_name", buyerName);
    formData.append("buyer_gstin", buyerGstin);
    formData.append("has_signed_pod", (!noPodChecked).toString());

    await auditClaim(formData);
  };

  const handleAuditComplete = () => {
    setIsLoading(false);
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <LoadingOverlay isOpen={isLoading} onComplete={handleAuditComplete} />

      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Top Header & Demo Scenario Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 border-b border-slate-800/80 pb-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-emerald-500/10 to-[#ff9900]/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Autonomous MSMED Statutory Audit</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              Claim Intake &amp; Evidentiary Ingestion
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm">
              Upload invoice and proof of delivery. DhanSetu cross-references Section 15 caps and Section 43B(h) tax penalties.
            </p>
          </div>

          {/* 1-Click Demo Scenarios Quick-Chips */}
          <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-2xl shrink-0 space-y-2 max-w-md">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase text-amber-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" /> 1-Click Pitch Scenarios
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Instant Fill</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-1.5">
              {demoScenarios.map((scenario, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectScenario(idx)}
                  className={`px-3 py-1.5 rounded-xl text-left transition-all cursor-pointer border text-xs font-semibold ${
                    selectedCaseIdx === idx
                      ? "bg-[#ff9900]/15 border-[#ff9900] text-white shadow-sm ring-1 ring-[#ff9900]/30"
                      : "bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <div className="text-[11px] font-bold">{scenario.badge}</div>
                  <div className="text-[9px] text-slate-400 font-mono mt-0.5">{scenario.tag}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Intake Form */}
        <form onSubmit={handleAuditSubmit} className={`space-y-6 transition-all ${flashEffect ? "opacity-75 scale-[0.99]" : "opacity-100 scale-100"}`}>
          
          {/* Document Dropzones Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Invoice Dropzone */}
            <div className="bg-[#111827]/80 backdrop-blur border border-slate-700/80 rounded-2xl p-6 shadow-xl space-y-4 hover:border-slate-600 transition">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#ff9900]" />
                  <span>Tax Invoice (.pdf / .jpg)</span>
                </label>
                <span className="text-[10px] text-emerald-400 font-semibold uppercase px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30">
                  Mandatory
                </span>
              </div>

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setInvoiceDragOver(true);
                }}
                onDragLeave={() => setInvoiceDragOver(false)}
                onDrop={handleInvoiceDrop}
                onClick={() => invoiceInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                  invoiceDragOver
                    ? "border-emerald-400 bg-emerald-950/20 scale-[1.01]"
                    : invoiceFileName
                    ? "border-emerald-500/60 bg-slate-900/80 shadow-lg shadow-emerald-500/5"
                    : "border-slate-700 hover:border-slate-500 bg-slate-900/50"
                }`}
              >
                <input
                  type="file"
                  ref={invoiceInputRef}
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      const file = e.target.files[0];
                      setInvoiceFile(file);
                      setInvoiceFileName(file.name);
                      setInvoiceFileSize(`${Math.round(file.size / 1024)} KB`);
                    }
                  }}
                />

                {invoiceFileName ? (
                  <div className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-emerald-500/30">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <div className="text-xs font-bold text-white truncate max-w-[180px] sm:max-w-xs">{invoiceFileName}</div>
                        <div className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                          <Check className="w-3 h-3" /> Ready for Textract OCR • {invoiceFileSize}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 hover:text-white underline">Change</span>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center mb-3 text-slate-400">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-bold text-white">Click or drag invoice file</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Supports standard Indian GST Invoices</p>
                  </>
                )}
              </div>
            </div>

            {/* Delivery Challan (POD) Dropzone */}
            <div className="bg-[#111827]/80 backdrop-blur border border-slate-700/80 rounded-2xl p-6 shadow-xl space-y-4 hover:border-slate-600 transition">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Proof of Delivery (POD / LR)</span>
                </label>
                <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded border ${
                  noPodChecked
                    ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                    : "bg-blue-500/10 text-blue-400 border-blue-500/30"
                }`}>
                  {noPodChecked ? "Missing (Sec 15 Risk)" : "Recommended"}
                </span>
              </div>

              {!noPodChecked ? (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setChallanDragOver(true);
                  }}
                  onDragLeave={() => setChallanDragOver(false)}
                  onDrop={handleChallanDrop}
                  onClick={() => challanInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                    challanDragOver
                      ? "border-emerald-400 bg-emerald-950/20 scale-[1.01]"
                      : challanFileName
                      ? "border-emerald-500/60 bg-slate-900/80 shadow-lg shadow-emerald-500/5"
                      : "border-slate-700 hover:border-slate-500 bg-slate-900/50"
                  }`}
                >
                  <input
                    type="file"
                    ref={challanInputRef}
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        const file = e.target.files[0];
                        setChallanFile(file);
                        setChallanFileName(file.name);
                        setChallanFileSize(`${Math.round(file.size / 1024)} KB`);
                        setNoPodChecked(false);
                      }
                    }}
                  />

                  {challanFileName ? (
                    <div className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-emerald-500/30">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                          <div className="text-xs font-bold text-white truncate max-w-[180px] sm:max-w-xs">{challanFileName}</div>
                          <div className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                            <Check className="w-3 h-3" /> Signed POD Attached • {challanFileSize}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400 hover:text-white underline">Change</span>
                    </div>
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center mb-3 text-slate-400">
                        <UploadCloud className="w-6 h-6" />
                      </div>
                      <p className="text-xs font-bold text-white">Click or drag delivery challan</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Signed delivery receipt or Lorry Receipt (LR)</p>
                    </>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/30 space-y-1">
                  <div className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span>Missing POD Evidentiary Caveat</span>
                  </div>
                  <p className="text-[11px] text-rose-200 leading-relaxed">
                    Under MSMED Act Section 15, if no signed POD exists, the deemed acceptance window is vulnerable if the buyer raises a dispute within 15 days.
                  </p>
                </div>
              )}

              {/* No POD Checkbox */}
              <div className="pt-2 flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 hover:text-white">
                  <input
                    type="checkbox"
                    checked={noPodChecked}
                    onChange={(e) => {
                      setNoPodChecked(e.target.checked);
                      if (e.target.checked) setChallanFileName("");
                    }}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-[#ff9900] focus:ring-[#ff9900]"
                  />
                  <span>I do not have a signed Delivery Challan / POD</span>
                </label>
              </div>
            </div>

          </div>

          {/* Creditor & Debtor Identity Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#111827]/80 backdrop-blur border border-slate-700/80 rounded-2xl p-4 space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-[#ff9900]" /> Registered Udyam No.
              </label>
              <input
                type="text"
                value={udyamNumber}
                onChange={(e) => setUdyamNumber(e.target.value)}
                placeholder="UDYAM-XX-00-0000000"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-[#ff9900] outline-none"
              />
            </div>

            <div className="bg-[#111827]/80 backdrop-blur border border-slate-700/80 rounded-2xl p-4 space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-400" /> Debtor Corporate Name
              </label>
              <input
                type="text"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-semibold focus:border-blue-400 outline-none"
              />
            </div>

            <div className="bg-[#111827]/80 backdrop-blur border border-slate-700/80 rounded-2xl p-4 space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-emerald-400" /> Debtor GSTIN
              </label>
              <input
                type="text"
                value={buyerGstin}
                onChange={(e) => setBuyerGstin(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-emerald-400 outline-none"
              />
            </div>
          </div>

          {/* Authentic WhatsApp Debtor Communication Transcript Bubble */}
          <div className="bg-[#111827]/80 backdrop-blur border border-slate-700/80 rounded-2xl p-5 sm:p-6 shadow-xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#25D366]/20 border border-[#25D366]/40 flex items-center justify-center text-[#25D366]">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Debtor Stalling Communication Transcript</span>
                    <span className="text-[10px] bg-[#25D366]/20 text-[#25D366] font-bold px-2 py-0.2 rounded-full">WhatsApp / Email</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Amazon Bedrock analyzes this excuse against statutory Section 15 timelines.
                  </p>
                </div>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Incoming from: {buyerName}</span>
            </div>

            {/* Simulated WhatsApp Chat Bubble */}
            <div className="p-4 rounded-2xl bg-[#0b141a] border border-[#202c33] relative">
              <div className="max-w-xl rounded-2xl rounded-tl-sm p-4 bg-[#202c33] border border-[#00a884]/20 shadow-md text-left space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-[#00a884]">{buyerName} (Accounts Head)</span>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3" /> Yesterday, 4:42 PM
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={chatText}
                  onChange={(e) => setChatText(e.target.value)}
                  placeholder="Paste debtor's WhatsApp excuse or stalling email here..."
                  className="w-full bg-transparent text-slate-200 text-xs sm:text-sm resize-none focus:outline-none leading-relaxed font-sans"
                />
                <div className="flex justify-end text-[10px] text-slate-400 font-mono">
                  <span>Delivered ✓✓</span>
                </div>
              </div>
            </div>
          </div>

          {/* Big Launch Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#ff9900] via-amber-500 to-emerald-500 hover:brightness-110 active:scale-[0.99] text-slate-950 text-base font-black flex items-center justify-center gap-3 shadow-xl shadow-[#ff9900]/25 transition cursor-pointer"
            >
              <Zap className="w-5 h-5 fill-current" />
              <span>Run Statutory Legal Audit &amp; Generate Recovery Dossier</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <div className="flex items-center justify-center gap-4 text-xs text-slate-400 mt-3 font-medium">
              <span>✓ Amazon Textract Ingestion</span>
              <span>•</span>
              <span>✓ MSMED Section 15 &amp; 16 Audit</span>
              <span>•</span>
              <span>✓ Section 43B(h) Corporate Tax Shield</span>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
}
