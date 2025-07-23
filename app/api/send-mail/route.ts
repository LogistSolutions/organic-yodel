export async function POST(req: NextRequest) {
  console.log("SMTP_USER:", process.env.SMTP_USER);
  // Restlicher Code...
}
import { NextRequest, NextResponse } from 'next/server';
import { chromium } from 'playwright';
import nodemailer from 'nodemailer';

export async function POST(req: NextRequest) {
  try {
    const { html, kundenNummer, referenz, empfaengerMail } = await req.json();

    // SMTP-Variablen ausgeben:
    console.log("SMTP_HOST:", process.env.SMTP_HOST);
    console.log("SMTP_PORT:", process.env.SMTP_PORT);
    console.log("SMTP_USER:", process.env.SMTP_USER);

    // Fehler bei fehlenden SMTP-Daten
    //if (!process.env.SMTP_HOST || !process.env.SMTP_PORT || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      //throw new Error("Fehlende SMTP-Umgebungsdaten! Prüfe deine .env.local");
    //}

    // 1. PDF mit Playwright erzeugen
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

    // 2. Nodemailer Transport für IONOS (Port 465, secure: true!)
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // SMTP-Login explizit testen (optional)
    await transporter.verify().then(() => {
      console.log("SMTP-Verbindung erfolgreich!");
    }).catch(err => {
      throw new Error("SMTP-Verify fehlgeschlagen: " + err);
    });

    // 3. E-Mail senden
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
      JSON.stringify({
        error: e instanceof Error ? e.message : String(e),
        stack: e instanceof Error ? e.stack : undefined,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
