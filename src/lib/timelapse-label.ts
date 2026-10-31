import QRCode from "qrcode";
import { PDFDocument, PDFFont, StandardFonts, rgb } from "pdf-lib";

// 4x6in (101.6x152.4mm) — matches the Royal Mail Click & Drop postage label
// this is printed alongside, measured from a reference PDF.
const labelWidthPt = 4 * 72;
const labelHeightPt = 6 * 72;
const margin = 24;
const black = rgb(0, 0, 0);

function sizeToFit(font: PDFFont, text: string, maxWidth: number, startSize: number, minSize = 7) {
  let size = startSize;
  while (size > minSize && font.widthOfTextAtSize(text, size) > maxWidth) size -= 1;
  return size;
}

/** Generates a print-ready, black-and-white PDF label: QR code, brand, order ref. Re-derivable any time from the link — nothing about it is stored. */
export async function buildTimelapseLabelPdf({ url, etsyOrderId, customerName }: { url: string; etsyOrderId: string; customerName: string }): Promise<Uint8Array> {
  const qrPng = await QRCode.toBuffer(url, { type: "png", margin: 1, width: 900, color: { dark: "#000000", light: "#ffffff" } });

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([labelWidthPt, labelHeightPt]);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const qrImage = await pdfDoc.embedPng(qrPng);

  const contentWidth = labelWidthPt - margin * 2;

  page.drawText("3DCRAFTS", { x: margin, y: labelHeightPt - 48, size: 26, font: bold, color: black });

  const caption = "Scan to watch your print come to life";
  const captionSize = sizeToFit(regular, caption, contentWidth, 13);
  page.drawText(caption, { x: (labelWidthPt - regular.widthOfTextAtSize(caption, captionSize)) / 2, y: labelHeightPt - 90, size: captionSize, font: regular, color: black });

  const qrSize = contentWidth * 0.78;
  const qrY = labelHeightPt - 110 - qrSize;
  page.drawImage(qrImage, { x: (labelWidthPt - qrSize) / 2, y: qrY, width: qrSize, height: qrSize });

  const urlSize = sizeToFit(regular, url, contentWidth, 9);
  page.drawText(url, { x: (labelWidthPt - regular.widthOfTextAtSize(url, urlSize)) / 2, y: qrY - 18, size: urlSize, font: regular, color: black });

  const greeting = `Hi ${customerName} — enjoy!`;
  const greetingSize = sizeToFit(bold, greeting, contentWidth, 12);
  page.drawText(greeting, { x: margin, y: 56, size: greetingSize, font: bold, color: black });

  const orderLine = `Order ref: ${etsyOrderId}`;
  const orderSize = sizeToFit(regular, orderLine, contentWidth, 11);
  page.drawText(orderLine, { x: margin, y: 38, size: orderSize, font: regular, color: black });

  return pdfDoc.save();
}
