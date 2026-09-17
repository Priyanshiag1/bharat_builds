import { Document, NormalizedClaimData, EvidenceGaps, ExtractedField, EvidenceGapStatus } from '../domain/models';

export class ClaimIntakeService {
  
  public normalizeExtraction(rawExtraction: Record<string, any>): NormalizedClaimData {
    return {
      sellerGstin: this.mapField(rawExtraction.VENDOR_GSTIN),
      buyerGstin: this.mapField(rawExtraction.CUSTOMER_GSTIN),
      invoiceNumber: this.mapField(rawExtraction.INVOICE_RECEIPT_ID),
      invoiceDate: this.mapField(rawExtraction.INVOICE_RECEIPT_DATE),
      dueDate: this.mapField(rawExtraction.DUE_DATE),
      principalAmount: rawExtraction.TOTAL ? { value: parseFloat(rawExtraction.TOTAL) } : undefined,
      sellerName: this.mapField(rawExtraction.VENDOR_NAME),
      buyerName: this.mapField(rawExtraction.CUSTOMER_NAME),
      purchaseOrderReference: this.mapField(rawExtraction.PO_NUMBER)
    };
  }

  private mapField(value: any): ExtractedField<string> | undefined {
    return value ? { value: String(value) } : undefined;
  }

  public detectEvidenceGaps(data: NormalizedClaimData, documents: Document[]): EvidenceGaps {
    const hasPO = documents.some(d => d.type === 'purchase_order');
    const hasChallan = documents.some(d => d.type === 'delivery_challan');
    
    return {
      invoiceNumber: data.invoiceNumber ? 'present' : 'missing',
      invoiceDate: data.invoiceDate ? 'present' : 'missing',
      buyerIdentity: data.buyerGstin || data.buyerName ? 'present' : 'missing',
      sellerIdentity: data.sellerGstin || data.sellerName ? 'present' : 'missing',
      gstinFormat: data.buyerGstin || data.sellerGstin ? 'present' : 'not_checked',
      dueDate: data.dueDate ? 'present' : 'missing',
      purchaseOrder: hasPO || data.purchaseOrderReference ? 'present' : 'missing',
      deliveryChallan: hasChallan ? 'present' : 'missing',
      amountsConsistent: 'not_checked',
      datesConsistent: 'not_checked'
    };
  }
}
