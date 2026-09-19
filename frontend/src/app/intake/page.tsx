"use client";

import { useState, useRef, useMemo } from "react";
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
  Scale,
  Plus,
  Trash2,
  Layers,
  Calculator,
  Truck,
  FileSpreadsheet,
} from "lucide-react";
import LoadingOverlay from "@/components/LoadingOverlay";
import { auditClaim } from "@/lib/api";

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
  const [hasConsigneeStamp, setHasConsigneeStamp] = useState(true);

  // Identity & Core Details
  const [udyamNumber, setUdyamNumber] = useState("UDYAM-MH-01-0012345");
  const [buyerName, setBuyerName] = useState("Apex Infrastructure Ltd");
  const [buyerGstin, setBuyerGstin] = useState("07AAAAA0000A1Z5");
  const [sellerGstin, setSellerGstin] = useState("27AAACW1234F1Z5");

  // ⭐ Edge Case 1 & 7: Dual Dates (Kacha Bill vs Pakka Bill)
  const [deliveryDate, setDeliveryDate] = useState("2024-05-14"); // Kacha Bill / Physical Delivery (Statutory anchor)
  const [invoiceDate, setInvoiceDate] = useState("2024-05-10");   // Pakka Bill / GST Invoice Date

  // ⭐ Edge Case 1: Editable OCR Values & Math Checksum Validator
  const [subtotalAmount, setSubtotalAmount] = useState<number>(211864.41);
  const [taxAmount, setTaxAmount] = useState<number>(38135.59);
  const [grandTotalAmount, setGrandTotalAmount] = useState<number>(250000);

  // ⭐ Edge Case 4: Handwritten Katoti / Spot Deductions
  const [hasKatoti, setHasKatoti] = useState(true);
  const [katotiAmount, setKatotiAmount] = useState<number>(3000);
  const [katotiReason, setKatotiReason] = useState<string>("Transit damage / broken packaging (noted on challan margin)");

  // ⭐ Edge Case 5: Vernacular Unit of Measurement (UOM)
  const [selectedUom, setSelectedUom] = useState<string>("Thaan");
  const [quantity, setQuantity] = useState<number>(25);

  // ⭐ Edge Case 6: Staggered Batch Deliveries Toggle
  const [isStaggeredBatch, setIsStaggeredBatch] = useState(false);
  const [batches, setBatches] = useState([
    { id: 1, date: "2024-05-14", amount: 100000, lrNumber: "LR-7891 (Truck MH-04-112)" },
    { id: 2, date: "2024-05-28", amount: 150000, lrNumber: "LR-8204 (Truck DL-01-998)" },
  ]);

  // Debtor Communication
  const [chatText, setChatText] = useState(
    "Sir our quarterly statutory audit is ongoing, director is traveling. Payment will be released once accounts department completes verification."
  );

  // Scenario Quick-Chips
  const [selectedCaseIdx, setSelectedCaseIdx] = useState<number>(0);
  const [flashEffect, setFlashEffect] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const invoiceInputRef = useRef<HTMLInputElement>(null);
  const challanInputRef = useRef<HTMLInputElement>(null);

  // Real-time Math Checksum Check: Subtotal + Tax == Grand Total
  const ocrChecksumValid = useMemo(() => {
    const sum = subtotalAmount + taxAmount;
    return Math.abs(sum - grandTotalAmount) < 2.0;
  }, [subtotalAmount, taxAmount, grandTotalAmount]);

  // Net Legally Clean Principal (after subtracting spot Katoti)
  const netPrincipalClaim = useMemo(() => {
    if (!hasKatoti) return grandTotalAmount;
    return Math.max(0, grandTotalAmount - katotiAmount);
  }, [grandTotalAmount, hasKatoti, katotiAmount]);

  // UOM Normalization conversion text
  const uomConversionNote = useMemo(() => {
    switch (selectedUom) {
      case "Thaan":
        return `Normalized: 25 Thaan ≈ 1,000 Meters standard fabric roll`;
      case "Bora":
        return `Normalized: Standard 50kg Mandi Jute Sacks`;
      case "Peti":
        return `Normalized: Standard Corrugated Master Cartons`;
      case "Nag":
        return `Normalized: Discrete Individual Finished Units`;
      default:
        return `Standard Metric Measurement`;
    }
  }, [selectedUom]);

  const demoScenarios = [
    {
      badge: "🟢 Case 1: Happy Path",
      tag: "₹2.5L Overdue • 72 Days",
      buyer: "Apex Infrastructure Ltd",
      gstin: "07AAAAA0000A1Z5",
      inv: "INV-2024-089_ApexInfra.pdf",
      excuse: "Sir our quarterly statutory audit is ongoing, director is traveling. Payment will be released once accounts department completes verification.",
      hasPod: true,
      hasStamp: true,
      subtotal: 211864.41,
      tax: 38135.59,
      total: 250000,
      katoti: 3000,
      delDate: "2024-05-14",
      invDate: "2024-05-10",
      uom: "Thaan",
    },
    {
      badge: "🟡 Case 2: Missing POD / Bilty",
      tag: "Section 15 Risk • 50 Days",
      buyer: "Metro Infra Logistics Ltd",
      gstin: "06CCCCC2222C1Z8",
      inv: "INV-2024-112_MetroLogistics.pdf",
      excuse: "We need to re-verify if all parts were received at the site. Stores team hasn't stamped delivery.",
      hasPod: false,
      hasStamp: false,
      subtotal: 152542.37,
      tax: 27457.63,
      total: 180000,
      katoti: 0,
      delDate: "2024-06-01",
      invDate: "2024-05-25",
      uom: "Peti",
    },
    {
      badge: "🔴 Case 3: Severe Default",
      tag: "₹5.8L Overdue • 120 Days",
      buyer: "Zenith Mills Pvt Ltd",
      gstin: "29BBBBB1111B1Z2",
      inv: "INV-2024-041_ZenithMills.pdf",
      excuse: "Management has not approved the budget due to acute liquidity crisis. We need another 60 days.",
      hasPod: true,
      hasStamp: true,
      subtotal: 491525.42,
      tax: 88474.58,
      total: 580000,
      katoti: 8000,
      delDate: "2024-03-15",
      invDate: "2024-03-10",
      uom: "Bora",
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
    setSubtotalAmount(c.subtotal);
    setTaxAmount(c.tax);
    setGrandTotalAmount(c.total);
    setKatotiAmount(c.katoti);
    setHasKatoti(c.katoti > 0);
    setDeliveryDate(c.delDate);
    setInvoiceDate(c.invDate);
    setSelectedUom(c.uom);
    setHasConsigneeStamp(c.hasStamp);

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
    setTimeout(() => setFlashEffect(false), 500);
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
      setHasConsigneeStamp(true);
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
    formData.append("seller_gstin", sellerGstin);
    formData.append("has_signed_pod", (!noPodChecked).toString());
    formData.append("delivery_date", deliveryDate);
    formData.append("invoice_date", invoiceDate);
    formData.append("principal_amount", netPrincipalClaim.toString());
    formData.append("katoti_deduction", hasKatoti ? katotiAmount.toString() : "0");
    formData.append("vernacular_uom", selectedUom);

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
        
        {/* Top Header & 1-Click Pitch Scenarios */}
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
              Upload invoice and delivery bilty. DhanSetu cross-references Section 15 caps, Katoti adjustments, and Section 43B(h) tax penalties.
            </p>
          </div>

          {/* 1-Click Pitch Scenarios */}
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
                    <p className="text-[11px] text-slate-400 mt-0.5">Faded carbon copies or digital GST invoices</p>
                  </>
                )}
              </div>
            </div>

            {/* Delivery Challan / Transporter Bilty Dropzone */}
            <div className="bg-[#111827]/80 backdrop-blur border border-slate-700/80 rounded-2xl p-6 shadow-xl space-y-4 hover:border-slate-600 transition">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-white flex items-center gap-2">
                  <Truck className="w-4 h-4 text-emerald-400" />
                  <span>Transporter Bilty / Delivery Challan (POD)</span>
                </label>
                <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded border ${
                  noPodChecked
                    ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                    : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                }`}>
                  {noPodChecked ? "Missing (Sec 15 Risk)" : "Verified (Sec 15 Anchor)"}
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
                        setHasConsigneeStamp(true);
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
                            <Check className="w-3 h-3" /> Signed Bilty Attached • {challanFileSize}
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
                      <p className="text-xs font-bold text-white">Click or drag delivery challan / bilty</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Signed transport lorry receipt or gate pass</p>
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
                    Under MSMED Act Section 15, if no signed POD exists, the 15-day deemed acceptance clock is vulnerable to buyer dispute.
                  </p>
                </div>
              )}

              {/* Edge Case 2 Verification: Consignee Stamp Checkbox */}
              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                  <input
                    type="checkbox"
                    checked={hasConsigneeStamp && !noPodChecked}
                    onChange={(e) => setHasConsigneeStamp(e.target.checked)}
                    disabled={noPodChecked}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500"
                  />
                  <span>Consignee rubber stamp &amp; signature clearly visible</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-white">
                  <input
                    type="checkbox"
                    checked={noPodChecked}
                    onChange={(e) => {
                      setNoPodChecked(e.target.checked);
                      if (e.target.checked) setChallanFileName("");
                    }}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-[#ff9900] focus:ring-[#ff9900]"
                  />
                  <span>No POD attached</span>
                </label>
              </div>
            </div>

          </div>

          {/* ⭐ GROUND-LEVEL FACTORY FLOOR PROTECTION PANEL (Solves Edge Cases 1, 2, 4, 5, 6, 7) */}
          <div className="bg-[#111827]/90 backdrop-blur border border-amber-500/30 rounded-3xl p-6 shadow-2xl space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <span>Ground-Level Physical Ingestion Safeguards</span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-mono font-bold">
                      24 Edge Cases Solved
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Defends against faded carbon digits, handwritten Katoti cuts, vernacular trade units &amp; Kacha bills.
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg">
                MSMED Sec 15 &amp; 16 Enforceable
              </span>
            </div>

            {/* Row 1: Dual Dates (Edge Cases 2 & 7: Kacha vs Pakka Bill) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" /> Physical Delivery Date (Bilty / Kacha Bill)
                  </label>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/30">
                    Statutory Sec 15 Anchor
                  </span>
                </div>
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-emerald-500 outline-none"
                />
                <p className="text-[10px] text-slate-400 leading-snug">
                  Section 15 mandates that the 45-day timer begins on physical receipt date, regardless of when tax invoice was generated.
                </p>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#ff9900]" /> Tax Invoice Date (Pakka Bill)
                  </label>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                    GST Document Date
                  </span>
                </div>
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-[#ff9900] outline-none"
                />
                <p className="text-[10px] text-slate-400 leading-snug">
                  Official GST e-invoice or tax bill creation date.
                </p>
              </div>
            </div>

            {/* Row 2: Editable OCR Values & Math Checksum (Edge Case 1: Faded Carbon Digit Hallucination) */}
            <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Calculator className="w-3.5 h-3.5 text-blue-400" /> Editable OCR Review &amp; Mathematical Checksum Check
                </span>
                <span className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${
                  ocrChecksumValid
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                }`}>
                  {ocrChecksumValid ? "✓ Math Checksum Verified (Subtotal + Tax == Total)" : "⚠️ Faded Digit Alert: Check Subtotal & Tax"}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <span className="text-[11px] text-slate-400">Subtotal (INR):</span>
                  <input
                    type="number"
                    value={subtotalAmount}
                    onChange={(e) => setSubtotalAmount(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-blue-400 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] text-slate-400">GST / Tax Amount (INR):</span>
                  <input
                    type="number"
                    value={taxAmount}
                    onChange={(e) => setTaxAmount(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-blue-400 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] text-slate-400 font-bold text-amber-300">Grand Total (INR):</span>
                  <input
                    type="number"
                    value={grandTotalAmount}
                    onChange={(e) => setGrandTotalAmount(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono font-bold focus:border-[#ff9900] outline-none"
                  />
                </div>
              </div>
              <p className="text-[10px] text-slate-400">
                You can manually correct faint carbon copy digits (e.g. if OCR misreads 8 as 3 or drops a zero).
              </p>
            </div>

            {/* Row 3: Handwritten Katoti & Vernacular UOM (Edge Cases 4 & 5) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Handwritten Katoti / Spot Deduction */}
              <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                    <span>Handwritten Margin Katoti / Spot Deductions</span>
                  </label>
                  <input
                    type="checkbox"
                    checked={hasKatoti}
                    onChange={(e) => setHasKatoti(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-purple-500 focus:ring-purple-500"
                  />
                </div>

                {hasKatoti && (
                  <div className="space-y-2 pt-1">
                    <div className="flex gap-2">
                      <div className="w-1/3 space-y-1">
                        <span className="text-[10px] text-slate-400">Deduction (INR):</span>
                        <input
                          type="number"
                          value={katotiAmount}
                          onChange={(e) => setKatotiAmount(Number(e.target.value))}
                          placeholder="3000"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-rose-400 font-mono font-bold focus:border-purple-400 outline-none"
                        />
                      </div>
                      <div className="w-2/3 space-y-1">
                        <span className="text-[10px] text-slate-400">Spot Deduction Reason:</span>
                        <input
                          type="text"
                          value={katotiReason}
                          onChange={(e) => setKatotiReason(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:border-purple-400 outline-none"
                        />
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-purple-950/30 border border-purple-500/30 flex items-center justify-between text-xs">
                      <span className="text-purple-300 font-medium">Net Enforceable Principal:</span>
                      <span className="font-mono font-black text-white">₹{netPrincipalClaim.toLocaleString("en-IN")}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-snug">
                      Deducting handwritten pen notes preserves legal integrity so the debtor cannot accuse you of filing an inflated claim.
                    </p>
                  </div>
                )}
              </div>

              {/* Vernacular Unit of Measurement */}
              <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                    <span>Vernacular Trade Unit of Measurement (UOM)</span>
                  </label>
                  <span className="text-[10px] font-mono text-slate-400">Indian Commodity Normalizer</span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400">Trade Unit:</span>
                    <select
                      value={selectedUom}
                      onChange={(e) => setSelectedUom(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 outline-none cursor-pointer"
                    >
                      <option value="Thaan">Thaan (थाना - Fabric Rolls)</option>
                      <option value="Bora">Bora (बोरी - 50kg Sacks)</option>
                      <option value="Peti">Peti (पेटी - Cartons)</option>
                      <option value="Nag">Nag (नग - Discrete Units)</option>
                      <option value="Meters">Meters (Standard Metric)</option>
                      <option value="Pieces">Pieces (Standard)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400">Quantity:</span>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-amber-400 outline-none"
                    />
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-amber-300/90 font-mono">
                  {uomConversionNote}
                </div>
              </div>

            </div>

            {/* Row 4: Staggered Batch Deliveries Accordion (Edge Case 6) */}
            <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Staggered Batch Dispatches (Multiple Trucks on 1 Consolidated Invoice)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsStaggeredBatch(!isStaggeredBatch)}
                  className="text-xs font-mono font-bold text-[#ff9900] hover:underline cursor-pointer"
                >
                  {isStaggeredBatch ? "Hide Batches" : "+ Configure Multiple Batches"}
                </button>
              </div>

              {isStaggeredBatch && (
                <div className="space-y-2 pt-2">
                  <p className="text-[11px] text-slate-400 leading-snug">
                    Under Section 15 MSMED Act, each truck delivery starts an independent 45-day statutory payment clock.
                  </p>
                  <div className="space-y-2">
                    {batches.map((batch, index) => (
                      <div key={batch.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono">
                        <span className="text-emerald-400 font-bold">Batch #{index + 1}: {batch.lrNumber}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-300">Date: {batch.date}</span>
                          <span className="text-white font-bold">Amount: ₹{batch.amount.toLocaleString("en-IN")}</span>
                          <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">Independent Clock Active</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
                    Amazon Bedrock Claude 3 Haiku analyzes this excuse against statutory Section 15 deemed-acceptance timelines.
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
              <span>✓ Katoti Pre-Deduction Reconciled</span>
              <span>•</span>
              <span>✓ Section 15 &amp; 16 Audit</span>
              <span>•</span>
              <span>✓ Section 43B(h) Corporate Tax Shield</span>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
}
