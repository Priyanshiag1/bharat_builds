import { InterestCalculation, NormalizedClaimData } from '../domain/models';

export interface InterestEngine {
  calculateInterest(claimId: string, data: NormalizedClaimData): Promise<InterestCalculation>;
}

/**
 * Adapter to call Person C's Python-based API engine.
 * Provides a seamless local fallback so Person B can test offline without AWS credentials.
 * 
 * CONFIGURATION:
 * Person C's API uses: RBI_RATE = 6.75% (DynamoDB backed)
 * Local Fallback uses: FALLBACK_RBI_RATE = 6.5% (Deterministic offline)
 */
const FALLBACK_RBI_RATE = 6.5;
const FALLBACK_STATUTORY_MULTIPLIER = 3.0;
const FALLBACK_STATUTORY_RATE = FALLBACK_RBI_RATE * FALLBACK_STATUTORY_MULTIPLIER;

export class PersonCApiAdapter implements InterestEngine {
  
  public async calculateInterest(claimId: string, data: NormalizedClaimData): Promise<InterestCalculation> {
    try {
      // Attempt to route to Person C's local FastAPI bridge
      const res = await fetch(`http://127.0.0.1:8000/claims/${claimId}/audit`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!res.ok) throw new Error('API failed or DynamoDB missing credentials');
      
      const json = await res.json() as any;
      
      return {
        daysOverdue: json.audit.days_overdue,
        bankRate: json.audit.statutory_penal_rate / 3, // Reverse-calculated 3x multiplier
        applicableInterestRate: json.audit.statutory_penal_rate,
        interestAccrued: json.audit.interest_accrued,
        totalClaimAmount: json.audit.total_recoverable_amount,
        explanation: 'Calculated via Person C Python API (DynamoDB)',
        calculationMode: 'api',
        statutoryMultiplier: 3.0
      };
    } catch (e) {
      console.warn(`⚠️ Person C API unavailable. Falling back to local offline determinism. (${(e as Error).message})`);
      
      // Local fallback calculation for Person B's independent testing
      const principal = data.principalAmount?.value || 0;
      const days = 45; // Deterministic test value
      const accrued = principal * (FALLBACK_STATUTORY_RATE / 100) * (days / 365);
      
      return {
        daysOverdue: days,
        bankRate: FALLBACK_RBI_RATE,
        applicableInterestRate: FALLBACK_STATUTORY_RATE,
        interestAccrued: accrued,
        totalClaimAmount: principal + accrued,
        explanation: `Calculated via Local Fallback (Offline Mode using ${FALLBACK_RBI_RATE}% RBI rate)`,
        calculationMode: 'offline_fallback',
        statutoryMultiplier: FALLBACK_STATUTORY_MULTIPLIER
      };
    }
  }
}
