import { ClaimData } from "@/types/claim";
import { mockClaim } from "@/mockData";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export async function auditClaim(formData: FormData): Promise<ClaimData> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const res = await fetch(`${BACKEND_URL}/api/audit`, {
      method: "POST",
      body: formData,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      // Store latest audited claim in localStorage for persistence across pages
      if (typeof window !== "undefined") {
        localStorage.setItem("vasuli_active_claim", JSON.stringify(data));
      }
      return data;
    }
  } catch (err) {
    console.warn("Backend /api/audit unreachable, using frozen mock contract data:", err);
  }

  // Fallback to frozen mock claim
  if (typeof window !== "undefined") {
    localStorage.setItem("vasuli_active_claim", JSON.stringify(mockClaim));
  }
  return mockClaim;
}

export function getActiveClaim(): ClaimData {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("vasuli_active_claim");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // use default
      }
    }
  }
  return mockClaim;
}

export function updateClaimStatus(claimId: string, status: "SETTLED" | "NOTICE_SENT", settlementType?: "LUMP_SUM_DISCOUNT" | "EMI_PLAN"): ClaimData {
  const current = getActiveClaim();
  const updated: ClaimData = {
    ...current,
    status,
    settlement_type: settlementType,
    settled_at: new Date().toISOString(),
  };
  if (typeof window !== "undefined") {
    localStorage.setItem("vasuli_active_claim", JSON.stringify(updated));
  }
  return updated;
}

export async function resolveClaimOnBackend(claimId: string, settlementType: "LUMP_SUM_DISCOUNT" | "EMI_PLAN") {
  try {
    const res = await fetch(`${BACKEND_URL}/api/claims/${claimId}/resolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ settlement_type: settlementType }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn("Could not reach backend resolution endpoint:", e);
  }
  return null;
}

export function getNoticePdfUrl(claimId: string, tier: "tier1" | "tier2") {
  return `${BACKEND_URL}/api/claims/${claimId}/notices/${tier}/pdf`;
}

export function getDossierPdfUrl(claimId: string) {
  return `${BACKEND_URL}/api/claims/${claimId}/dossier/pdf`;
}

export function getSettlementAgreementPdfUrl(claimId: string) {
  return `${BACKEND_URL}/api/claims/${claimId}/settlement-agreement/pdf`;
}

export function getRpadPdfUrl(claimId: string) {
  return `${BACKEND_URL}/api/claims/${claimId}/rpad/pdf`;
}

export function getIbbiFormBPdfUrl(claimId: string) {
  return `${BACKEND_URL}/api/claims/${claimId}/ibbi-form-b/pdf`;
}

export async function dispatchNotice(claimId: string, buyerEmail?: string, buyerPhone?: string) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/claims/${claimId}/dispatch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ buyer_email: buyerEmail, buyer_phone: buyerPhone }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn("Could not dispatch notice via backend API:", e);
  }
  // Fallback demo response
  return {
    status: "DISPATCHED",
    claim_id: claimId,
    token: `magic-${claimId}-demo`,
    portal_url: `http://localhost:3000/resolve/${claimId}`,
    channels: {
      email: { recipient: buyerEmail || "accounts@apexinfra.com", message_id: "ses-msg-demo-2026", status: "SENT" },
      whatsapp: { recipient: buyerPhone || "+919876543210", deep_link: `https://wa.me/919876543210?text=Dispute%20Settlement`, status: "READY" },
      step_functions: { execution_arn: `arn:aws:states:us-east-1:123456789012:execution:vasuli-demo:${claimId}`, status: "RUNNING" }
    }
  };
}

export async function getTelemetryLogs() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/telemetry/logs`);
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn("Telemetry API unreachable, using cached telemetry:", e);
  }
  return null;
}

export function mapClaimAssessmentToClaimData(assessment: any, fallback: ClaimData = mockClaim): ClaimData {
  if (!assessment) return fallback;
  const norm = assessment.normalizedData || {};
  const interest = assessment.interestCalculation;
  const reply = assessment.buyerReplyClassification;
  const strength = assessment.strengthScore;
  const gaps = assessment.evidenceGaps;

  return {
    ...fallback,
    claim_id: assessment.claimId || fallback.claim_id,
    invoice_number: norm.invoiceNumber?.value || fallback.invoice_number,
    invoice_date: norm.invoiceDate?.value || fallback.invoice_date,
    principal_amount: norm.principalAmount?.value ?? fallback.principal_amount,
    buyer_name: norm.buyerName?.value || fallback.buyer_name,
    buyer_gstin: norm.buyerGstin?.value || fallback.buyer_gstin,
    seller_gstin: norm.sellerGstin?.value || fallback.seller_gstin,
    has_signed_pod: gaps ? gaps.deliveryChallan !== "missing" : fallback.has_signed_pod,
    days_overdue: interest?.daysOverdue ?? fallback.days_overdue,
    accrued_interest: interest?.interestAccrued ?? fallback.accrued_interest,
    total_claimable_amount: interest?.totalClaimAmount ?? fallback.total_claimable_amount,
    claim_strength_score: strength?.score ?? fallback.claim_strength_score,
    stalling_category: reply?.category ? reply.category.replace(/_/g, " ").toUpperCase() : fallback.stalling_category,
    counter_reasoning: reply?.explanation || fallback.counter_reasoning,
    classification_mode: reply?.classificationMode || "bedrock",
    component_scores: strength?.componentScores,
  };
}
