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
} from "lucide-react";
import LoadingOverlay from "@/components/LoadingOverlay";
import { auditClaim } from "@/lib/api";
import { sampleCases } from "@/mockData";

export default function IntakePage() {
  const router = useRouter();

  // Form State
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [invoiceFileName, setInvoiceFileName] = useState<string>("Invoice_INV-2024-089.pdf");
  const [invoiceDragOver, setInvoiceDragOver] = useState(false);

  const [challanFile, setChallanFile] = useState<File | null>(null);
  const [challanFileName, setChallanFileName] = useState<string>("Delivery_Challan_Signed.jpg");
  const [challanDragOver, setChallanDragOver] = useState(false);

  const [noPodChecked, setNoPodChecked] = useState(false);
  const [udyamNumber, setUdyamNumber] = useState("UDYAM-MH-01-0012345");
  const [buyerName, setBuyerName] = useState("Apex Infrastructure Ltd");
  const [buyerGstin, setBuyerGstin] = useState("07AAAAA0000A1Z5");
  const [chatText, setChatText] = useState(
    "Sir our quarterly statutory audit is ongoing, director is traveling. Payment will be released once accounts department completes verification."
  );

  // Overlay state
  const [isLoading, setIsLoading] = useState(false);

  // File Inputs Refs
  const invoiceInputRef = useRef<HTMLInputElement>(null);
  const challanInputRef = useRef<HTMLInputElement>(null);

  const handleSelectCase = (index: number) => {
    const c = sampleCases[index];
    setBuyerName(c.buyer);
    setBuyerGstin(c.buyerGstin || "07AAAAA0000A1Z5");
    setChatText(c.excuse);
    setInvoiceFileName(`${c.invNumber || "INV-2024-089"}.pdf`);
    if (!c.hasPod) {
      setNoPodChecked(true);
      setChallanFile(null);
      setChallanFileName("");
    } else {
      setNoPodChecked(false);
      setChallanFileName("Delivery_Challan_Signed.jpg");
    }
  };

  const handleInvoiceDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setInvoiceDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setInvoiceFile(file);
      setInvoiceFileName(file.name);
    }
  };

  const handleChallanDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setChallanDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setChallanFile(file);
      setChallanFileName(file.name);
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

    // Submit to API / Local storage
    await auditClaim(formData);
  };

  const handleAuditComplete = () => {
    setIsLoading(false);
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <LoadingOverlay isOpen={isLoading} onComplete={handleAuditComplete} />

      <div className="max-w-5xl mx-auto space-y-8">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ff9900]/10 border border-[#ff9900]/30 text-[#ff9900] text-xs font-bold uppercase tracking-wider mb-2">
              <Zap className="w-3.5 h-3.5" /> Module 1 & 2 Intake Engine
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              Claim Intake & MSMED Compliance Audit
            </h1>
            <p className="text-slate-400 text-sm sm:text-base mt-1">
              Ingest commercial invoices, evaluate Section 15 default thresholds, and generate calibrated legal actions.
            </p>
          </div>

          {/* Quick Demo Cases Pills */}
          <div className="flex flex-col items-start md:items-end gap-1.5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>Test Invoices & Sourcing Presets</span>
            </span>
            <div className="flex flex-wrap gap-1.5 max-w-lg justify-start md:justify-end">
              {sampleCases.map((c, idx) => {
                const isHF = c.source?.includes("HuggingFace");
                return (
                  <button
                    key={c.id || c.label}
                    type="button"
                    onClick={() => handleSelectCase(idx)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium border transition ${
                      isHF
                        ? "bg-blue-950/40 border-blue-500/40 text-blue-300 hover:bg-blue-900/60"
                        : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white"
                    }`}
                  >
                    {isHF ? `🤗 ${c.label.split(":")[0]}` : c.label.split(":")[0]}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main Intake Form */}
        <form onSubmit={handleAuditSubmit} className="space-y-6">
          {/* Document Dropzones Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Invoice Dropzone */}
            <div className="bg-[#1e293b] border border-slate-700/80 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#ff9900]" />
                  Tax Invoice (.pdf / .jpg)
                </label>
                <span className="text-[10px] text-slate-400 font-semibold uppercase px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                  Required
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
                className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                  invoiceFileName
                    ? "border-emerald-500 bg-emerald-950/20 shadow-lg shadow-emerald-500/5"
                    : invoiceDragOver
                    ? "border-[#ff9900] bg-[#ff9900]/10"
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
                      setInvoiceFile(e.target.files[0]);
                      setInvoiceFileName(e.target.files[0].name);
                    }
                  }}
                />
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${
                    invoiceFileName ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {invoiceFileName ? <CheckCircle2 className="w-6 h-6" /> : <UploadCloud className="w-6 h-6" />}
                </div>

                {invoiceFileName ? (
                  <div>
                    <p className="text-sm font-bold text-emerald-400 break-all">{invoiceFileName}</p>
                    <p className="text-xs text-slate-400 mt-1">Ready for Amazon Textract OCR extraction</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-semibold text-white">Click to upload or drag & drop</p>
                    <p className="text-xs text-slate-400 mt-1">Supports PDF, JPG, PNG (Max 15MB)</p>
                  </div>
                )}
              </div>
            </div>

            {/* Delivery Challan Dropzone */}
            <div className="bg-[#1e293b] border border-slate-700/80 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-400" />
                  Proof of Delivery / Challan
                </label>
                <span className="text-[10px] text-slate-400 font-semibold uppercase px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                  Evidentiary Proof
                </span>
              </div>

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setChallanDragOver(true);
                }}
                onDragLeave={() => setChallanDragOver(false)}
                onDrop={handleChallanDrop}
                onClick={() => !noPodChecked && challanInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center transition-all ${
                  noPodChecked
                    ? "border-amber-500/50 bg-amber-950/20 opacity-70 cursor-not-allowed"
                    : challanFileName
                    ? "border-emerald-500 bg-emerald-950/20 shadow-lg shadow-emerald-500/5 cursor-pointer"
                    : challanDragOver
                    ? "border-[#ff9900] bg-[#ff9900]/10 cursor-pointer"
                    : "border-slate-700 hover:border-slate-500 bg-slate-900/50 cursor-pointer"
                }`}
              >
                <input
                  type="file"
                  ref={challanInputRef}
                  accept=".pdf,.jpg,.jpeg,.png"
                  disabled={noPodChecked}
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setChallanFile(e.target.files[0]);
                      setChallanFileName(e.target.files[0].name);
                      setNoPodChecked(false);
                    }
                  }}
                />
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${
                    noPodChecked
                      ? "bg-amber-500/20 text-amber-400"
                      : challanFileName
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {noPodChecked ? (
                    <AlertTriangle className="w-6 h-6" />
                  ) : challanFileName ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : (
                    <UploadCloud className="w-6 h-6" />
                  )}
                </div>

                {noPodChecked ? (
                  <div>
                    <p className="text-sm font-bold text-amber-400">Delivery Proof Omitted</p>
                    <p className="text-xs text-slate-400 mt-1">Claim will be flagged for evidentiary gap</p>
                  </div>
                ) : challanFileName ? (
                  <div>
                    <p className="text-sm font-bold text-emerald-400 break-all">{challanFileName}</p>
                    <p className="text-xs text-slate-400 mt-1">Proof of delivery verified</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-semibold text-white">Upload signed delivery challan</p>
                    <p className="text-xs text-slate-400 mt-1">Stamped / Signed acknowledgment</p>
                  </div>
                )}
              </div>

              {/* Warning Trigger Checkbox */}
              <div className="pt-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={noPodChecked}
                    onChange={(e) => {
                      setNoPodChecked(e.target.checked);
                      if (e.target.checked) {
                        setChallanFile(null);
                        setChallanFileName("");
                      }
                    }}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500 focus:ring-offset-slate-900"
                  />
                  <span className="text-xs font-semibold text-slate-300 group-hover:text-white transition">
                    I do not possess signed delivery proof
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Missing POD Warning State Banner */}
          {noPodChecked && (
            <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/40 flex items-start gap-3 text-amber-200 text-xs sm:text-sm animate-in fade-in slide-in-from-top-2">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-amber-300">Evidentiary Vulnerability Alert: </span>
                Without a signed Delivery Challan or stamped receipt, the buyer may raise disputes regarding receipt of goods.
                Under Section 15 of MSMED Act, the 15-day deemed acceptance window begins from physical delivery date.
              </div>
            </div>
          )}

          {/* Supplier & Buyer Identity Card */}
          <div className="bg-[#1e293b] border border-slate-700/80 rounded-2xl p-6 shadow-xl space-y-5">
            <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Building2 className="w-4 h-4 text-[#ff9900]" />
              Parties & Statutory Credentials
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Udyam Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Supplier Udyam Registration
                </label>
                <input
                  type="text"
                  required
                  value={udyamNumber}
                  onChange={(e) => setUdyamNumber(e.target.value)}
                  placeholder="UDYAM-MH-01-0012345"
                  pattern="^UDYAM-[A-Z]{2}-[0-9]{2}-[0-9]{7}$"
                  title="Format: UDYAM-XX-00-0000000"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#ff9900]"
                />
                <span className="text-[10px] text-slate-400">Govt MSME Registration Number</span>
              </div>

              {/* Buyer Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Buyer Company Name</label>
                <input
                  type="text"
                  required
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  placeholder="Apex Infrastructure Ltd"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#ff9900]"
                />
                <span className="text-[10px] text-slate-400">Corporate Debtor Legal Name</span>
              </div>

              {/* Buyer GSTIN */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Buyer GSTIN</label>
                <input
                  type="text"
                  required
                  value={buyerGstin}
                  onChange={(e) => setBuyerGstin(e.target.value)}
                  placeholder="07AAAAA0000A1Z5"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#ff9900]"
                />
                <span className="text-[10px] text-slate-400">15-Digit GST Identification</span>
              </div>
            </div>
          </div>

          {/* Stalling Chat Ingestion */}
          <div className="bg-[#1e293b] border border-slate-700/80 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                Buyer Communication & Stalling Excuses
              </label>
              <span className="text-xs text-slate-400">Amazon Bedrock Sentiment Analysis</span>
            </div>

            <textarea
              rows={3}
              value={chatText}
              onChange={(e) => setChatText(e.target.value)}
              placeholder="Paste WhatsApp / Email stalling message received from the debtor..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#ff9900] leading-relaxed resize-none"
            />
          </div>

          {/* Glowing Action Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-4 px-8 rounded-2xl font-black text-slate-950 text-base sm:text-lg bg-gradient-to-r from-[#ff9900] via-amber-400 to-[#ff9900] hover:brightness-110 active:scale-[0.99] transition-all shadow-xl shadow-[#ff9900]/25 flex items-center justify-center gap-3 group"
            >
              <Sparkles className="w-5 h-5 text-slate-950 group-hover:rotate-12 transition-transform" />
              <span>Audit Claim under MSMED Act</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
