import os
import io
from datetime import datetime, date, timedelta
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from s3_service import upload_file_bytes, generate_presigned_url

def generate_legal_notice(case_data: dict, interest_data: dict, notice_tier: str = "TIER_2", custom_message: str = None) -> dict:
    """
    Generates a professional statutory legal notice PDF for MSME debt recovery.
    Uploads the PDF to Amazon S3 and returns the S3 URI and presigned download URL.
    
    notice_tier:
    - "TIER_1": Amicable Commercial Settlement Offer (With 5-Day Statutory Interest Waiver)
    - "TIER_2": Formal Statutory Demand Notice (under Sections 15 & 16 MSMED Act, 2006)
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )
    
    styles = getSampleStyleSheet()
    primary_color = colors.HexColor("#1A365D")   # Deep navy
    accent_color = colors.HexColor("#C53030")    # Crimson red
    dark_gray = colors.HexColor("#2D3748")
    light_bg = colors.HexColor("#F7FAFC")
    
    title_style = ParagraphStyle(
        'NoticeTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=19,
        textColor=primary_color,
        alignment=1
    )
    
    subtitle_style = ParagraphStyle(
        'NoticeSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=14,
        textColor=accent_color if notice_tier == "TIER_2" else primary_color,
        alignment=1
    )
    
    body_style = ParagraphStyle(
        'NoticeBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=14,
        textColor=dark_gray
    )
    
    bold_style = ParagraphStyle(
        'NoticeBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9.5,
        leading=14,
        textColor=dark_gray
    )

    story = []
    today_str = date.today().strftime("%B %d, %Y")
    claim_id = case_data.get("claim_id") or case_data.get("case_id", "VASULI-CLAIM")
    seller_name = case_data.get("seller_name", "Bharat Precision Components Pvt Ltd")
    seller_gstin = case_data.get("seller_gstin", "27AAACW1234F1Z5")
    seller_udyam = case_data.get("seller_udyam", "UDYAM-MH-03-0019284")
    
    buyer_name = case_data.get("buyer_name", "Apex Infrastructure & Engineering Ltd")
    buyer_gstin = case_data.get("buyer_gstin", "07AAAAA0000A1Z5")
    
    inv_no = case_data.get("invoice_number", "INV-2024-089")
    inv_date = case_data.get("invoice_date", "2024-05-10")
    
    principal = float(interest_data.get("principal_amount", 250000.0))
    interest_accrued = float(interest_data.get("interest_accrued", 18180.0))
    total_amount = float(interest_data.get("total_recoverable_amount", 268180.0))
    days_overdue = interest_data.get("days_overdue", 128)
    daily_rate = float(interest_data.get("daily_compounding_rate_rupees", 138.70))
    
    if notice_tier == "TIER_1":
        story.append(Paragraph("COMMERCIAL SETTLEMENT & STATUTORY INTEREST WAIVER OFFER", title_style))
        story.append(Paragraph("PURSUANT TO SECTION 15 OF THE MSMED ACT, 2006 | 5-DAY SETTLEMENT WINDOW", subtitle_style))
    else:
        story.append(Paragraph("LEGAL DEMAND NOTICE UNDER SECTIONS 15 & 16 OF THE MSMED ACT, 2006", title_style))
        story.append(Paragraph("FORMAL STATUTORY NOTICE PRIOR TO MSEFC ARBITRATION FILING", subtitle_style))
        
    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=1.5, color=primary_color))
    story.append(Spacer(1, 10))
    
    meta_data = [
        [Paragraph(f"<b>Ref Notice ID:</b> {claim_id}", body_style), Paragraph(f"<b>Date of Notice:</b> {today_str}", body_style)],
        [Paragraph(f"<b>MSME Registration:</b> {seller_udyam}", body_style), Paragraph(f"<b>Statutory Jurisdiction:</b> MSEFC Maharashtra", body_style)]
    ]
    meta_table = Table(meta_data, colWidths=[4.0 * inch, 3.2 * inch])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), light_bg),
        ('BOX', (0,0), (-1,-1), 0.5, colors.grey),
        ('PADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 12))
    
    addressee = f"""
    <b>TO:</b><br/>
    <b>The Managing Director / Chief Financial Officer</b><br/>
    {buyer_name}<br/>
    GSTIN: {buyer_gstin}<br/>
    """
    story.append(Paragraph(addressee, body_style))
    story.append(Spacer(1, 8))
    
    if notice_tier == "TIER_1":
        subj = f"<b>SUBJECT: Commercial Settlement Offer for Invoice {inv_no} dated {inv_date} — Opportunity for 100% Waiver of Statutory Compound Interest of Rs. {interest_accrued:,.2f}.</b>"
    else:
        subj = f"<b>SUBJECT: Statutory Demand Notice under Sections 15 & 16 of MSMED Act, 2006 for non-payment of Principal Rs. {principal:,.2f} plus Compounded Penal Interest Rs. {interest_accrued:,.2f} (Total: Rs. {total_amount:,.2f}).</b>"
    story.append(Paragraph(subj, bold_style))
    story.append(Spacer(1, 10))
    
    if notice_tier == "TIER_1":
        body_p1 = f"""
        Dear Sir/Madam,<br/><br/>
        We refer to Invoice No. <b>{inv_no}</b> dated <b>{inv_date}</b> for <b>Rs. {principal:,.2f}</b> towards goods supplied and accepted under Proof of Delivery. 
        As per Section 15 of the MSMED Act, 2006, the maximum permissible credit period is capped at 45 days. The said payment is overdue by <b>{days_overdue} days</b>.
        <br/><br/>
        Under Section 16 of the MSMED Act, compound interest with monthly rests at 3 times the RBI Bank Rate (currently <b>20.25% p.a.</b>) has accrued in the amount of <b>Rs. {interest_accrued:,.2f}</b>, increasing by <b>Rs. {daily_rate:,.2f} daily</b>.
        <br/><br/>
        <b>AMICABLE SETTLEMENT OFFER:</b> In the spirit of preserving our business relationship, we hereby offer you a <b>100% waiver</b> of all statutory interest accrued to date, conditional upon full principal payment of <b>Rs. {principal:,.2f}</b> within <b>5 (Five) business days</b>.
        <br/><br/>
        {f'<b>Note from Claimant:</b> {custom_message}<br/><br/>' if custom_message else ''}
        Please note that if the principal is not credited within 5 days, this offer stands automatically revoked, and full compounding interest will be recovered.
        """
    else:
        body_p1 = f"""
        Dear Sir/Madam,<br/><br/>
        Under instructions from our client, <b>{seller_name}</b>, registered under the MSMED Act, 2006 (Udyam: <b>{seller_udyam}</b>), we hereby serve you with this formal Statutory Demand Notice:
        <br/><br/>
        1. Our client supplied industrial goods under Invoice No. <b>{inv_no}</b> dated <b>{inv_date}</b> for <b>Rs. {principal:,.2f}</b>, acknowledged under Delivery Challan.
        <br/><br/>
        2. Pursuant to the Proviso to Section 15 of MSMED Act 2006, any defect objection was required to be communicated within 15 days of delivery. No objection was received. By law, goods stand deemed accepted unconditionally.
        <br/><br/>
        3. Under Section 16 of MSMED Act 2006, you are mandatorily liable to pay compound interest with monthly rests at <b>20.25% per annum</b> (3x RBI Bank Rate).
        <br/><br/>
        4. The total statutory debt payable by you as on date is computed hereunder:
        """
    story.append(Paragraph(body_p1, body_style))
    story.append(Spacer(1, 10))
    
    tax_disallowance = principal * 0.30
    
    fin_data = [
        ["Description", "Statutory Provision", "Amount (INR)"],
        ["Principal Invoice Value", f"Invoice {inv_no}", f"Rs. {principal:,.2f}"],
        ["Statutory Penal Interest Accrued", f"Section 16 @ 20.25% p.a. ({days_overdue} days)", f"Rs. {interest_accrued:,.2f}"],
        ["TOTAL STATUTORY CLAIM AS ON DATE", "Section 15 & 16 MSMED Act, 2006", f"Rs. {total_amount:,.2f}"],
        ["Current Daily Compounding Accrual", "Section 16 Monthly Rest Increment", f"Rs. {daily_rate:,.2f} / day"],
    ]
    if notice_tier == "TIER_2":
        fin_data.append(["Mandatory Debtor Tax Penalty", "Sec 43B(h) Income Tax Act (30% Tax)", f"Rs. {tax_disallowance:,.2f}"])
        
    fin_table = Table(fin_data, colWidths=[2.6 * inch, 2.8 * inch, 1.8 * inch])
    fin_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), primary_color),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,0), 9.5),
        ('BACKGROUND', (0,3), (-1,3), colors.HexColor("#FFF5F5") if notice_tier == "TIER_2" else light_bg),
        ('TEXTCOLOR', (0,3), (-1,3), accent_color if notice_tier == "TIER_2" else primary_color),
        ('FONTNAME', (0,3), (-1,3), 'Helvetica-Bold'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
        ('ALIGN', (2,0), (2,-1), 'RIGHT'),
        ('PADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(fin_table)
    story.append(Spacer(1, 12))
    
    if notice_tier == "TIER_1":
        closing = "<b>PAYMENT TERMS:</b> Please remit the principal via RTGS/NEFT and upload UTR acknowledgment on the online portal."
    else:
        closing = f"""
        <b>MANDATORY TAX DISALLOWANCE NOTICE (SECTION 43B(h) OF INCOME TAX ACT, 1961):</b><br/>
        TAKE NOTICE that pursuant to Section 43B(h) enacted under Finance Act 2023, failure to liquidate this outstanding MSME liability causes immediate disallowance of the entire expense of Rs. {principal:,.2f}, directly increasing your corporate income tax payable by <b>Rs. {tax_disallowance:,.2f}</b> (30% corporate rate plus penal interest under Sec 234B/C).
        <br/><br/>
        <b>DEMAND FOR PAYMENT & STATUTORY CONSEQUENCES:</b><br/>
        YOU ARE HEREBY CALLED UPON to pay <b>Rs. {total_amount:,.2f}</b> within <b>15 days</b>.<br/><br/>
        <b>PLEASE NOTE</b> that upon failure, our client shall file a Reference under <b>Section 18(1)</b> before the MSEFC Council. Under <b>Section 19</b> of the MSMED Act, no court or appellate body shall entertain any appeal against an MSEFC award without you first pre-depositing <b>75% of the awarded amount</b>.
        """
    story.append(Paragraph(closing, body_style))
    story.append(Spacer(1, 15))
    
    signoff = f"""
    Yours faithfully,<br/><br/>
    <b>For {seller_name}</b><br/>
    Authorized Signatory / Legal Recovery Cell<br/>
    Generated via Vasuli — MSME Statutory Legal Recovery Platform
    """
    story.append(Paragraph(signoff, body_style))
    
    doc.build(story)
    pdf_bytes = buffer.getvalue()
    
    s3_key = f"generated-letters/{claim_id}/{notice_tier.lower()}_{int(datetime.now().timestamp())}.pdf"
    s3_uri = upload_file_bytes(pdf_bytes, s3_key, content_type="application/pdf")
    presigned_url = generate_presigned_url(s3_key, expiration=86400)
    
    return {
        "s3_uri": s3_uri,
        "s3_key": s3_key,
        "presigned_url": presigned_url,
        "notice_tier": notice_tier,
        "filename": os.path.basename(s3_key),
        "generated_at": datetime.now().isoformat()
    }

def generate_tier3_samadhaan_dossier(case_data: dict, interest_data: dict) -> dict:
    """
    Builds the official MSEFC Samadhaan Form 1 Filing Summary & Evidence Dossier.
    Format complies with Section 18(1) of the MSMED Act, 2006.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )
    styles = getSampleStyleSheet()
    navy = colors.HexColor("#0F2942")
    gold = colors.HexColor("#B7791F")
    
    title_style = ParagraphStyle('DossierTitle', parent=styles['Heading1'], fontSize=14, leading=17, alignment=1, textColor=navy)
    subtitle_style = ParagraphStyle('DossierSub', parent=styles['Normal'], fontSize=9, leading=12, alignment=1, textColor=gold, fontName='Helvetica-Bold')
    section_hdr = ParagraphStyle('SecHdr', parent=styles['Heading2'], fontSize=11, leading=15, textColor=navy, fontName='Helvetica-Bold')
    body = ParagraphStyle('DossierBody', parent=styles['Normal'], fontSize=9, leading=13)
    
    claim_id = case_data.get("claim_id") or case_data.get("case_id", "CLAIM-001")
    seller = case_data.get("seller_name", "Bharat Precision Components Pvt Ltd")
    buyer = case_data.get("buyer_name", "Apex Infrastructure & Engineering Ltd")
    principal = float(interest_data.get("principal_amount", 250000.0))
    interest = float(interest_data.get("interest_accrued", 144561.18))
    total = float(interest_data.get("total_recoverable_amount", 394561.18))
    
    story = [
        Paragraph("BEFORE THE MICRO AND SMALL ENTERPRISES FACILITATION COUNCIL (MSEFC)", title_style),
        Paragraph("FORM 1 — APPLICATION UNDER SECTION 18(1) OF THE MSMED ACT, 2006", subtitle_style),
        Spacer(1, 10),
        HRFlowable(width="100%", thickness=1.5, color=navy),
        Spacer(1, 10),
    ]
    
    # Case Docket
    docket = [
        [Paragraph(f"<b>REFERENCE NO:</b> MSEFC/{claim_id}", body), Paragraph(f"<b>FILING DATE:</b> {date.today()}", body)],
        [Paragraph(f"<b>PETITIONER (SUPPLIER):</b> {seller}", body), Paragraph(f"<b>UDYAM:</b> {case_data.get('seller_udyam', 'UDYAM-MH-03-0019284')}", body)],
        [Paragraph(f"<b>RESPONDENT (BUYER):</b> {buyer}", body), Paragraph(f"<b>GSTIN:</b> {case_data.get('buyer_gstin', '07AAAAA0000A1Z5')}", body)]
    ]
    docket_tbl = Table(docket, colWidths=[3.8*inch, 3.4*inch])
    docket_tbl.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#F7FAFC")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
        ('PADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(docket_tbl)
    story.append(Spacer(1, 12))
    
    # Statement of Claim
    story.append(Paragraph("1. STATEMENT OF CAUSE OF ACTION", section_hdr))
    cause_text = f"""
    1.1 The Petitioner is a registered Micro/Small Enterprise under the MSMED Act, 2006.<br/>
    1.2 The Petitioner supplied precision goods to the Respondent under Invoice No. <b>{case_data.get('invoice_number', 'INV-2024-089')}</b> dated <b>{case_data.get('invoice_date', '2024-05-10')}</b> for a principal amount of <b>Rs. {principal:,.2f}</b>.<br/>
    1.3 The Respondent received the goods under Proof of Delivery and failed to notify any defect objection within 15 days, resulting in deemed statutory acceptance under Section 15.<br/>
    1.4 Despite formal statutory demand notice, the Respondent has defaulted for over <b>{interest_data.get('days_overdue', 830)} days</b>.
    """
    story.append(Paragraph(cause_text, body))
    story.append(Spacer(1, 10))
    
    # Statutory Interest Calculation Summary
    story.append(Paragraph("2. STATUTORY COMPOUND INTEREST STATEMENT (SECTION 16)", section_hdr))
    int_tbl_data = [
        ["Claim Component", "Statutory Rate / Rule", "Amount (INR)"],
        ["Principal Debt", "Section 15 MSMED Act", f"Rs. {principal:,.2f}"],
        ["Compounded Penal Interest", "Section 16 (20.25% p.a. monthly rests)", f"Rs. {interest:,.2f}"],
        ["Total Recoverable Claim", "Award Claimed by Petitioner", f"Rs. {total:,.2f}"],
        ["Continuous Daily Accrual", "Section 16 ongoing penalty", f"Rs. {interest_data.get('daily_compounding_rate_rupees', 218.90):,.2f} / day"]
    ]
    int_table = Table(int_tbl_data, colWidths=[2.6*inch, 2.8*inch, 1.8*inch])
    int_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), navy),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
        ('ALIGN', (2,0), (2,-1), 'RIGHT'),
        ('PADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(int_table)
    story.append(Spacer(1, 10))
    
    # Evidence Annexure Index
    story.append(Paragraph("3. LIST OF ANNEXURES (EVIDENCE VAULT)", section_hdr))
    annex_data = [
        ["Annexure", "Document Description", "Verification Status"],
        ["Annexure A-1", "Udyam Registration Certificate", "VERIFIED (Active MSME)"],
        ["Annexure A-2", f"Tax Invoice No. {case_data.get('invoice_number', 'INV-2024-089')}", "VERIFIED"],
        ["Annexure A-3", "Signed Proof of Delivery (Challan)", "VERIFIED (Acknowledged)"],
        ["Annexure A-4", "Section 15 & 16 Legal Demand Notice", "SERVED VIA REGISTERED POST/EMAIL"],
        ["Annexure A-5", "Debtor Communication & Stalling Logs", "FILED (Belated Dispute)"]
    ]
    annex_table = Table(annex_data, colWidths=[1.4*inch, 4.0*inch, 1.8*inch])
    annex_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#2D3748")),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
        ('PADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(annex_table)
    story.append(Spacer(1, 12))
    
    # Prayer / Relief
    story.append(Paragraph("4. PRAYER FOR RELIEF", section_hdr))
    prayer = f"""
    The Petitioner prays that this Hon'ble Council be pleased to:<br/>
    (a) Direct the Respondent to pay the principal sum of <b>Rs. {principal:,.2f}</b>;<br/>
    (b) Award compounded penal interest with monthly rests at 3x RBI Bank Rate (<b>20.25% p.a.</b>) amounting to <b>Rs. {interest:,.2f}</b> till date of payment;<br/>
    (c) Award full legal costs and arbitration expenses incurred by the Petitioner.
    """
    story.append(Paragraph(prayer, body))
    story.append(Spacer(1, 15))
    
    decl = f"""
    <b>VERIFICATION & DECLARATION:</b><br/>
    I, Authorized Representative of {seller}, verify that contents of Paragraphs 1 to 4 are true and correct to the best of my knowledge and records.<br/><br/>
    <b>(Signed & Verified at Mumbai, India)</b><br/>
    Petitioner / Authorized Signatory
    """
    story.append(Paragraph(decl, body))
    
    doc.build(story)
    pdf_bytes = buffer.getvalue()
    
    s3_key = f"dossiers/{claim_id}/msefc_samadhaan_dossier_{int(datetime.now().timestamp())}.pdf"
    s3_uri = upload_file_bytes(pdf_bytes, s3_key, content_type="application/pdf")
    presigned_url = generate_presigned_url(s3_key, expiration=86400)
    
    return {
        "s3_uri": s3_uri,
        "s3_key": s3_key,
        "presigned_url": presigned_url,
        "document_type": "MSEFC_SAMADHAAN_DOSSIER",
        "generated_at": datetime.now().isoformat()
    }

def generate_settlement_agreement(claim_data: dict, settlement_type: str = "3_PART_EMI") -> dict:
    """
    Generates a legally binding Digital Settlement Agreement Deed.
    Covers Amicable Lump-sum settlement or 3-Installment EMI payment plan.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
    styles = getSampleStyleSheet()
    navy = colors.HexColor("#1A365D")
    
    title_style = ParagraphStyle('AgrTitle', parent=styles['Heading1'], fontSize=15, alignment=1, textColor=navy, leading=19)
    body = ParagraphStyle('AgrBody', parent=styles['Normal'], fontSize=9.5, leading=14)
    bold = ParagraphStyle('AgrBold', parent=styles['Normal'], fontSize=9.5, leading=14, fontName='Helvetica-Bold')
    
    claim_id = claim_data.get("claim_id", "CLAIM-001")
    seller = claim_data.get("seller_name", "Bharat Precision Components Pvt Ltd")
    buyer = claim_data.get("buyer_name", "Apex Infrastructure & Engineering Ltd")
    principal = float(claim_data.get("principal_amount", 250000.0))
    
    story = [
        Paragraph("DEED OF BINDING SETTLEMENT AGREEMENT", title_style),
        Paragraph("PURSUANT TO COMMERCIAL CONCILIATION UNDER SECTION 18 OF MSMED ACT, 2006", ParagraphStyle('Sub', alignment=1, fontSize=9, fontName='Helvetica-Bold', textColor=colors.grey)),
        Spacer(1, 10),
        HRFlowable(width="100%", thickness=1.5, color=navy),
        Spacer(1, 10)
    ]
    
    emi_amount = round(principal / 3.0, 2)
    today = date.today()
    date_1 = today + timedelta(days=5)
    date_2 = today + timedelta(days=35)
    date_3 = today + timedelta(days=65)
    
    recital = f"""
    This Binding Settlement Agreement is executed on <b>{today.strftime('%B %d, %Y')}</b> between:<br/>
    <b>1. {seller}</b> (hereinafter referred to as the <b>'Claimant/Supplier'</b>), AND<br/>
    <b>2. {buyer}</b> (hereinafter referred to as the <b>'Debtor/Buyer'</b>).<br/><br/>
    <b>WHEREAS:</b> The Debtor owes an outstanding principal of <b>Rs. {principal:,.2f}</b> under Invoice No. <b>{claim_data.get('invoice_number', 'INV-2024-089')}</b>.<br/>
    <b>TERMS OF RESTRUCTURED SETTLEMENT:</b><br/>
    1. The Claimant agrees to waive 100% of accrued statutory compound penal interest, STRICTLY SUBJECT to the timely clearance of the agreed payment schedule hereunder:
    """
    story.append(Paragraph(recital, body))
    story.append(Spacer(1, 10))
    
    sched_data = [
        ["Installment", "Due Date", "Amount Payable (INR)", "Status"],
        ["Installment 1 (33.3%)", date_1.strftime('%d-%b-%Y'), f"Rs. {emi_amount:,.2f}", "SCHEDULED"],
        ["Installment 2 (33.3%)", date_2.strftime('%d-%b-%Y'), f"Rs. {emi_amount:,.2f}", "SCHEDULED"],
        ["Installment 3 (33.4%)", date_3.strftime('%d-%b-%Y'), f"Rs. {round(principal - (emi_amount*2), 2):,.2f}", "SCHEDULED"]
    ]
    sched_table = Table(sched_data, colWidths=[2.0*inch, 1.8*inch, 2.0*inch, 1.4*inch])
    sched_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), navy),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
        ('PADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(sched_table)
    story.append(Spacer(1, 12))
    
    default_clause = """
    <b>2. DEFAULT ACCELERATION CLAUSE:</b> In the event the Debtor fails to credit any of the installments on or before the due date, the statutory interest waiver shall stand revoked with immediate effect. The entire principal plus statutory compound interest at 20.25% p.a. from the original due date shall become immediately due and recoverable through the MSEFC Council without further notice.
    """
    story.append(Paragraph(default_clause, body))
    story.append(Spacer(1, 15))
    
    sigs = [
        [Paragraph(f"<b>For {seller}</b><br/>(Claimant / Supplier)<br/>Digitally Acknowledged", body),
         Paragraph(f"<b>For {buyer}</b><br/>(Debtor / Buyer)<br/>Digitally Accepted via Settlement Portal", body)]
    ]
    sig_tbl = Table(sigs, colWidths=[3.6*inch, 3.6*inch])
    sig_tbl.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 0.5, colors.grey),
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#F7FAFC")),
        ('PADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(sig_tbl)
    
    doc.build(story)
    pdf_bytes = buffer.getvalue()
    
    s3_key = f"settlements/{claim_id}/binding_settlement_agreement_{int(datetime.now().timestamp())}.pdf"
    s3_uri = upload_file_bytes(pdf_bytes, s3_key, content_type="application/pdf")
    presigned_url = generate_presigned_url(s3_key, expiration=86400)
    
    return {
        "s3_uri": s3_uri,
        "s3_key": s3_key,
        "presigned_url": presigned_url,
        "document_type": "SETTLEMENT_AGREEMENT_DEED",
        "generated_at": datetime.now().isoformat()
    }

# Convenient aliases
generate_msefc_dossier = generate_tier3_samadhaan_dossier

