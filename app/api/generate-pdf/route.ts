import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

export async function POST(req: NextRequest) {
  const { html } = await req.json();

  const browser = await puppeteer.launch({
    headless: "new", // für aktuelle Puppeteer-Versionen
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });

  // Optional: Custom CSS (z.B. für Druck-Optimierung)
  // await page.addStyleTag({ content: "body { color: red; }" });

  const pdfBuffer = await page.pdf({
    format: "A4",
    printBackground: true,
    margin: { top: "16mm", right: "12mm", bottom: "16mm", left: "12mm" },
  });

  await browser.close();

  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="Kalkulation.pdf"`,
    },
  });
}
