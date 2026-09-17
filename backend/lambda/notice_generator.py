import os
import io
from datetime import datetime, date
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from s3_service import upload_file_bytes, generate_presigned_url

def generate_legal_notice(case_data: dict, interest_data: dict, notice_tier: str = "TIER_2") -> dict:
    """
    Generates a professional statutory legal notice PDF for MSME debt recovery.
    Uploads the PDF to Amazon S3 and returns the S3 URI and presigned download URL.
    
    notice_tier:
    - "TIER_1": Amicable Commercial Settlement Offer (With 5-Day Statutory Interest Waiver)
    - "TIER_2": Formal Statutory Demand Notice (under Sections 15 & 16 MSMED Act, 2006)
    - "TIER_3": MSEFC Samadhaan Form 1 Filing Statement
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
    
    # Header & Badging
    today_str = date.today().strftime("%B %d, %Y")
    claim_id = case_data.get("case_id", "VASOOL-CLAIM")
    seller_name = case_data.get("seller_name", "Bharat Precision Components Pvt Ltd")
    seller_gstin = case_data.get("seller_gstin", "27AAACW1234F1Z5")
    seller_udyam = case_data.get("seller_udyam", "UDYAM-MH-03-0019284")
    
    buyer_name = case_data.get("buyer_name", "Apex Infrastructure & Engineering Ltd")
    buyer_gstin = case_data.get("buyer_gstin", "07AAAAA0000A1Z5")
    
    inv_no = case_data.get("invoice_number", "INV-2024-089")
    inv_date = case_data.get("invoice_date", "2024-05-10")
    
    principal = interest_data.get("principal_amount", 250000.0)
    interest_accrued = interest_data.get("interest_accrued", 18180.0)
    total_amount = interest_data.get("total_recoverable_amount", 268180.0)
    days_overdue = interest_data.get("days_overdue", 128)
    daily_rate = interest_data.get("daily_compounding_rate_rupees", 138.70)
    
    if notice_tier == "TIER_1":
        story.append(Paragraph("COMMERCIAL SETTLEMENT & STATUTORY INTEREST WAIVER OFFER", title_style))
        story.append(Paragraph("PURSUANT TO SECTION 15 OF THE MSMED ACT, 2006 | 5-DAY SETTLEMENT WINDOW", subtitle_style))
    elif notice_tier == "TIER_3":
        story.append(Paragraph("MSEFC SAMADHAAN STATUTORY APPLICATION (FORM 1)", title_style))
        story.append(Paragraph("SUBMITTED UNDER SECTION 18(1) OF THE MSMED ACT, 2006", subtitle_style))
    else:
        story.append(Paragraph("LEGAL DEMAND NOTICE UNDER SECTIONS 15 & 16 OF THE MSMED ACT, 2006", title_style))
        story.append(Paragraph("FORMAL STATUTORY NOTICE PRIOR TO MSEFC ARBITRATION FILING", subtitle_style))
        
    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=1.5, color=primary_color))
    story.append(Spacer(1, 10))
    
    # Metadata Table
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
    
    # Addressee Section
    addressee = f"""
    <b>TO:</b><br/>
    <b>The Managing Director / Chief Financial Officer</b><br/>
    {buyer_name}<br/>
    GSTIN: {buyer_gstin}<br/>
    """
    story.append(Paragraph(addressee, body_style))
    story.append(Spacer(1, 8))
    
    # Subject Line
    if notice_tier == "TIER_1":
        subj = f"<b>SUBJECT: Commercial Settlement Offer for Invoice {inv_no} dated {inv_date} — Opportunity for 100% Waiver of Statutory Compound Interest of Rs. {interest_accrued:,.2f}.</b>"
    else:
        subj = f"<b>SUBJECT: Statutory Demand Notice under Sections 15 & 16 of the Micro, Small and Medium Enterprises Development Act, 2006 for non-payment of Principal Rs. {principal:,.2f} plus Compounded Penal Interest Rs. {interest_accrued:,.2f} (Total: Rs. {total_amount:,.2f}).</b>"
    story.append(Paragraph(subj, bold_style))
    story.append(Spacer(1, 10))
    
    # Notice Body Content
    if notice_tier == "TIER_1":
        body_p1 = f"""
        Dear Sir/Madam,<br/><br/>
        We refer to Invoice No. <b>{inv_no}</b> dated <b>{inv_date}</b> for <b>Rs. {principal:,.2f}</b> towards goods supplied and accepted under Proof of Delivery. 
        As per the provisions of Section 15 of the MSMED Act, 2006, the maximum permissible credit period is capped at 45 days. The said payment has been overdue for <b>{days_overdue} days</b>.
        <br/><br/>
        Under Section 16 of the MSMED Act, compound interest at 3 times the RBI Bank Rate (currently <b>20.25% p.a.</b> with monthly rests) has accrued in the amount of <b>Rs. {interest_accrued:,.2f}</b>, increasing by <b>Rs. {daily_rate:,.2f} daily</b>.
        <br/><br/>
        <b>OUR AMICABLE SETTLEMENT OFFER:</b> In the spirit of preserving our ongoing business relationship, we hereby offer you a <b>100% waiver</b> of all statutory interest accrued to date, on the condition that the full principal amount of <b>Rs. {principal:,.2f}</b> is remitted to our bank account within <b>5 (Five) business days</b> of receipt of this notice.
        <br/><br/>
        Please note that if the principal is not credited within 5 days, this amicable offer stands automatically revoked, and we will initiate formal recovery proceedings for the full statutory claim of <b>Rs. {total_amount:,.2f}</b>.
        """
    else:
        body_p1 = f"""
        Dear Sir/Madam,<br/><br/>
        Under instructions from our client, <b>{seller_name}</b>, registered under the Micro, Small and Medium Enterprises Development (MSMED) Act, 2006 (Udyam: <b>{seller_udyam}</b>), we hereby serve you with this formal Statutory Demand Notice:
        <br/><br/>
        1. Our client supplied and delivered precision industrial goods under Invoice No. <b>{inv_no}</b> dated <b>{inv_date}</b> for a principal sum of <b>Rs. {principal:,.2f}</b>, duly received and acknowledged under Delivery Challan.
        <br/><br/>
        2. Pursuant to the Proviso to Section 15 of the MSMED Act, 2006, any defect objection was required to be communicated within 15 days of delivery. No valid objection was notified. By operation of law, the goods stand deemed accepted unconditionally.
        <br/><br/>
        3. Under Section 16 of the MSMED Act, 2006, you are mandatorily liable to pay compound interest with monthly rests at three times the RBI Bank Rate (<b>20.25% per annum</b>) from the statutory due date. This liability overrides any contrary contract clause or third-party payment dependency.
        <br/><br/>
        4. As on date, the invoice is overdue by <b>{days_overdue} days</b>. The total statutory debt payable by you is computed hereunder:
        """
    story.append(Paragraph(body_p1, body_style))
    story.append(Spacer(1, 10))
    
    # Financial Breakdown Table
    fin_data = [
        ["Description", "Statutory Provision", "Amount (INR)"],
        ["Principal Invoice Value", f"Invoice {inv_no}", f"Rs. {principal:,.2f}"],
        ["Statutory Penal Interest Accrued", f"Section 16 @ 20.25% p.a. ({days_overdue} days)", f"Rs. {interest_accrued:,.2f}"],
        ["TOTAL STATUTORY CLAIM AS ON DATE", "Section 15 & 16 MSMED Act, 2006", f"Rs. {total_amount:,.2f}"],
        ["Current Daily Compounding Accrual", "Section 16 Monthly Rest Increment", f"Rs. {daily_rate:,.2f} / day"]
    ]
    fin_table = Table(fin_data, colWidths=[2.6 * inch, 2.8 * inch, 1.8 * inch])
    fin_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), primary_color),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,0), 9.5),
        ('BOTTOMPADDING', (0,0), (-1,0), 6),
        ('BACKGROUND', (0,3), (-1,3), colors.HexColor("#FFF5F5") if notice_tier == "TIER_2" else light_bg),
        ('TEXTCOLOR', (0,3), (-1,3), accent_color if notice_tier == "TIER_2" else primary_color),
        ('FONTNAME', (0,3), (-1,3), 'Helvetica-Bold'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
        ('ALIGN', (2,0), (2,-1), 'RIGHT'),
        ('PADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(fin_table)
    story.append(Spacer(1, 12))
    
    # Final Demand / Warning
    if notice_tier == "TIER_1":
        closing = """
        <b>PAYMENT INSTRUCTIONS:</b><br/>
        Please remit the principal amount of Rs. 2,50,000 via RTGS/NEFT to our designated bank account and upload the UTR acknowledgment through our online settlement portal.
        """
    else:
        closing = f"""
        <b>DEMAND FOR PAYMENT & STATUTORY CONSEQUENCES:</b><br/>
        YOU ARE HEREBY CALLED UPON to pay the entire outstanding statutory claim of <b>Rs. {total_amount:,.2f}</b> within <b>15 (Fifteen) days</b> from the date of this notice.<br/><br/>
        <b>PLEASE TAKE FURTHER NOTICE</b> that upon your failure to do so, our client shall immediately file a Reference under <b>Section 18(1)</b> before the Micro and Small Enterprises Facilitation Council (MSEFC) through the MSME Samadhaan portal. 
        Pursuant to <b>Section 19</b> of the MSMED Act, no court or appellate body shall entertain any appeal or challenge by you against an MSEFC award without you first pre-depositing <b>75% of the awarded amount</b> with the court. Furthermore, all legal expenses, arbitration charges, and continuous compounding interest will be recovered at your risk and cost.
        """
    story.append(Paragraph(closing, body_style))
    story.append(Spacer(1, 15))
    
    # Sign-off
    signoff = f"""
    Yours faithfully,<br/><br/>
    <b>For {seller_name}</b><br/>
    (Authorized Signatory / Legal Department)<br/>
    Generated via Vasool AI — MSME Statutory Legal Recovery Platform
    """
    story.append(Paragraph(signoff, body_style))
    
    doc.build(story)
    pdf_bytes = buffer.getvalue()
    
    # Upload to S3
    s3_key = f"notices/{claim_id}_{notice_tier.lower()}_{int(datetime.now().timestamp())}.pdf"
    s3_uri = upload_file_bytes(pdf_bytes, s3_key, content_type="application/pdf")
    presigned_url = generate_presigned_url(s3_key, expiration=86400) # 24 hours
    
    return {
        "s3_uri": s3_uri,
        "s3_key": s3_key,
        "presigned_url": presigned_url,
        "notice_tier": notice_tier,
        "filename": os.path.basename(s3_key),
        "generated_at": datetime.now().isoformat()
    }

if __name__ == "__main__":
    print("Testing Notice Generator with AWS S3 Upload...")
    dummy_case = {
        "case_id": "VASOOL-2024-TEST-001",
        "seller_name": "Bharat Precision Components Pvt Ltd",
        "seller_gstin": "27AAACW1234F1Z5",
        "seller_udyam": "UDYAM-MH-03-0019284",
        "buyer_name": "Apex Infrastructure & Engineering Ltd",
        "buyer_gstin": "07AAAAA0000A1Z5",
        "invoice_number": "INV-2024-089",
        "invoice_date": "2024-05-10"
    }
    dummy_interest = {
        "principal_amount": 250000.0,
        "interest_accrued": 18180.03,
        "total_recoverable_amount": 268180.03,
        "days_overdue": 128,
        "daily_compounding_rate_rupees": 138.70
    }
    res = generate_legal_notice(dummy_case, dummy_interest, notice_tier="TIER_2")
    print("Successfully generated Tier-2 Legal Notice PDF!")
    print(f"S3 URI: {res['s3_uri']}")
    print(f"Presigned URL: {res['presigned_url'][:90]}...")
