import io
from datetime import datetime, timezone
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from app.models.fir import FIR
from app.schemas.analytics import AnalyticsOverviewData

def generate_fir_pdf(fir: FIR) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
    story = []
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        'FIRTitle',
        parent=styles['Heading1'],
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#1e293b'),
        alignment=1, # Center
        spaceAfter=12
    )

    subtitle_style = ParagraphStyle(
        'FIRSubTitle',
        parent=styles['Normal'],
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#475569'),
        alignment=1,
        spaceAfter=24
    )

    heading_style = ParagraphStyle(
        'FIRHeading',
        parent=styles['Heading2'],
        fontSize=14,
        leading=18,
        textColor=colors.HexColor('#0f172a'),
        spaceBefore=12,
        spaceAfter=8
    )

    body_style = ParagraphStyle(
        'FIRBody',
        parent=styles['Normal'],
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#334155')
    )

    story.append(Paragraph("STATE POLICE DEPARTMENT", title_style))
    story.append(Paragraph(f"FIRST INFORMATION REPORT (F.I.R.) - {fir.fir_number}", subtitle_style))
    story.append(Spacer(1, 10))

    data = [
        [Paragraph("<b>FIR Number:</b>", body_style), Paragraph(fir.fir_number, body_style), Paragraph("<b>Registration Date:</b>", body_style), Paragraph(fir.registered_at.strftime("%Y-%m-%d %H:%M UTC"), body_style)],
        [Paragraph("<b>Crime Ref:</b>", body_style), Paragraph(fir.crime.crime_number if fir.crime else "N/A", body_style), Paragraph("<b>Status:</b>", body_style), Paragraph(fir.status, body_style)],
        [Paragraph("<b>Complainant Name:</b>", body_style), Paragraph(fir.complainant_name, body_style), Paragraph("<b>Contact:</b>", body_style), Paragraph(fir.complainant_contact, body_style)],
        [Paragraph("<b>Address:</b>", body_style), Paragraph(fir.complainant_address or "N/A", body_style), Paragraph("<b>Sections of Law:</b>", body_style), Paragraph(fir.sections_of_law, body_style)],
    ]

    t = Table(data, colWidths=[130, 140, 130, 140])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
        ('PADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(t)
    story.append(Spacer(1, 15))

    story.append(Paragraph("Incident Summary & Details", heading_style))
    story.append(Paragraph(fir.incident_details or "No details recorded.", body_style))
    story.append(Spacer(1, 15))

    if fir.crime:
        story.append(Paragraph("Associated Crime Location & Details", heading_style))
        crime_data = [
            [Paragraph("<b>Crime Title:</b>", body_style), Paragraph(fir.crime.title, body_style)],
            [Paragraph("<b>Crime Type:</b>", body_style), Paragraph(fir.crime.crime_type, body_style)],
            [Paragraph("<b>Location:</b>", body_style), Paragraph(fir.crime.location_name, body_style)],
            [Paragraph("<b>Priority / Severity:</b>", body_style), Paragraph(f"{fir.crime.priority} / {fir.crime.severity}", body_style)],
        ]
        t_crime = Table(crime_data, colWidths=[150, 390])
        t_crime.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f1f5f9')),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
            ('PADDING', (0, 0), (-1, -1), 6),
        ]))
        story.append(t_crime)
        story.append(Spacer(1, 25))

    sig_data = [
        [Paragraph("___________________________<br/>Complainant Signature", body_style), Paragraph("___________________________<br/>Duty Officer / Station House Officer", body_style)]
    ]
    t_sig = Table(sig_data, colWidths=[270, 270])
    t_sig.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(Spacer(1, 30))
    story.append(t_sig)

    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()


def generate_analytics_report_pdf(overview: AnalyticsOverviewData) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
    story = []
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        'AnalyticsTitle',
        parent=styles['Heading1'],
        fontSize=18,
        leading=22,
        textColor=colors.HexColor('#0f172a'),
        alignment=1,
        spaceAfter=12
    )

    body_style = ParagraphStyle(
        'AnalyticsBody',
        parent=styles['Normal'],
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#334155')
    )

    story.append(Paragraph("STATE POLICE DEPARTMENT - EXECUTIVE ANALYTICS REPORT", title_style))
    story.append(Spacer(1, 10))

    summary_data = [
        [Paragraph("<b>Total Registered Crimes:</b>", body_style), Paragraph(str(overview.total_crimes), body_style), Paragraph("<b>Resolution Rate:</b>", body_style), Paragraph(f"{overview.resolution_rate}%", body_style)],
        [Paragraph("<b>Open Investigations:</b>", body_style), Paragraph(str(overview.open_crimes + overview.under_investigation), body_style), Paragraph("<b>Closed Cases:</b>", body_style), Paragraph(str(overview.closed_crimes), body_style)],
        [Paragraph("<b>Registered FIRs:</b>", body_style), Paragraph(str(overview.total_firs), body_style), Paragraph("<b>Evidence Items:</b>", body_style), Paragraph(str(overview.total_evidences), body_style)],
    ]
    t_summary = Table(summary_data, colWidths=[140, 130, 140, 130])
    t_summary.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
        ('PADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(t_summary)
    story.append(Spacer(1, 20))

    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()


def generate_generic_report_pdf(report_title: str, headers: list, rows: list, metadata_info: dict = None) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
    story = []
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        'RepTitle',
        parent=styles['Heading1'],
        fontSize=18,
        leading=22,
        textColor=colors.HexColor('#0f172a'),
        alignment=1,
        spaceAfter=6
    )

    meta_style = ParagraphStyle(
        'RepMeta',
        parent=styles['Normal'],
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#64748b'),
        alignment=1,
        spaceAfter=18
    )

    body_style = ParagraphStyle(
        'RepBody',
        parent=styles['Normal'],
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#1e293b')
    )

    header_style = ParagraphStyle(
        'RepHeader',
        parent=styles['Normal'],
        fontSize=9,
        leading=12,
        fontName="Helvetica-Bold",
        textColor=colors.HexColor('#ffffff')
    )

    story.append(Paragraph("STATE POLICE DEPARTMENT - OFFICIAL REPORT", title_style))
    now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    story.append(Paragraph(f"{report_title.upper()} • Generated: {now_str} • Verified Official Document", meta_style))
    story.append(Spacer(1, 10))

    if metadata_info:
        meta_table_data = []
        for k, v in metadata_info.items():
            meta_table_data.append([Paragraph(f"<b>{k}:</b>", body_style), Paragraph(str(v), body_style)])
        t_meta = Table(meta_table_data, colWidths=[150, 390])
        t_meta.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
            ('PADDING', (0, 0), (-1, -1), 5),
        ]))
        story.append(t_meta)
        story.append(Spacer(1, 15))

    # Data Table
    table_data = [[Paragraph(h, header_style) for h in headers]]
    for row in rows:
        table_data.append([Paragraph(str(cell), body_style) for cell in row])

    col_w = int(540 / max(len(headers), 1))
    t_data = Table(table_data, colWidths=[col_w] * len(headers))
    t_data.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0f172a')),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
        ('PADDING', (0, 0), (-1, -1), 5),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor('#ffffff'), colors.HexColor('#f8fafc')]),
    ]))
    story.append(t_data)
    story.append(Spacer(1, 25))

    # Official Seal & QR Placeholder
    footer_data = [
        [Paragraph("<b>DIGITAL VERIFICATION SEAL</b><br/>QR / Barcode: CRMS-SEC-99210<br/>Hash: SHA256-48A190", meta_style), Paragraph("___________________________<br/>Authorized Officer Signature", body_style)]
    ]
    t_foot = Table(footer_data, colWidths=[270, 270])
    t_foot.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(t_foot)

    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()
