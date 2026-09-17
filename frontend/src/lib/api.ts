import { ClaimData } from "@/types/claim";
import { mockClaim } from "@/mockData";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export async function auditClaim(formData: FormData): Promise<ClaimData> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

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
