import { NextRequest, NextResponse } from 'next/server';
import { chromium } from 'playwright';
import nodemailer from 'nodemailer';

export async function POST(req: NextRequest) {
  try {
    const { html, kundenNummer, referenz, empfaengerMail } = await req.json();

    const browser = await chromium.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle" });
    const pdfBytes = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "16mm", right: "12mm", bottom: "16mm", left: "12mm" },
    });
    await browser.close();

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Kalkulator" <${process.env.SMTP_USER}>`,
      to: empfaengerMail,
      subject: `${kundenNummer} - ${referenz}`,
      text: `Anbei die Kalkulation für Ihren Auftrag (Kundennummer: ${kundenNummer}, Referenz: ${referenz})`,
      attachments: [
        {
          filename: `Kalkulation_${kundenNummer}_${referenz}.pdf`,
          content: pdfBytes,
        },
      ],
    });

    return NextResponse.json({ status: 'ok' });
  } catch (e) {
    console.error("PDF-Mail-Fehler:", e);
    return new NextResponse(
      JSON.stringify({ error: e instanceof Error ? e.message : String(e) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
