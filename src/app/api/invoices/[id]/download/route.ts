import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import puppeteer from "puppeteer";
import { Invoice, InvoiceItem } from "@prisma/client";

type InvoiceWithItems = Invoice & {
  items: InvoiceItem[];
};

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    console.log(`Generating PDF for invoice: ${id}`);

    // Fetch invoice data from database
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Generate HTML for the invoice
    const html = generateInvoiceHTML(invoice);

    // Launch puppeteer and generate PDF
    console.log("Launching browser...");
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    });
    console.log("Browser launched");

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "10mm",
        right: "10mm",
        bottom: "10mm",
        left: "10mm",
      },
    });

    await browser.close();

    // Return PDF as response
    const headers = new Headers();
    headers.set("Content-Type", "application/pdf");
    headers.set(
      "Content-Disposition",
      `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`,
    );

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      headers,
    });
  } catch (error) {
    console.error("Error generating PDF:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to generate PDF", details: errorMessage },
      { status: 500 },
    );
  }
}

function generateInvoiceHTML(invoice: InvoiceWithItems): string {
  // Calculate totals
  const subtotal = invoice.items.reduce((sum: number, item: InvoiceItem) => sum + item.amount, 0);

  let discountAmount = 0;
  if (invoice.discountType === "PERCENTAGE") {
    discountAmount = (subtotal * invoice.discount) / 100;
  } else {
    discountAmount = invoice.discount;
  }

  const afterDiscount = subtotal - discountAmount;
  const taxAmount = (afterDiscount * invoice.taxRate) / 100;
  const total = afterDiscount + taxAmount + invoice.shipping;

  const formatCurrency = (amount: number) => {
    const symbols: Record<string, string> = {
      USD: "$",
      EUR: "€",
      GBP: "£",
      IDR: "Rp",
    };
    const symbol = symbols[invoice.currency] || invoice.currency;
    return `${symbol}${amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (date?: Date | string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          padding: 20px;
          background: white;
          color: #111827;
        }

        .invoice-container {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          padding: 40px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 30px;
        }

        .header h1 {
          font-size: 32px;
          font-weight: bold;
          color: #111827;
          margin-bottom: 5px;
        }

        .invoice-number {
          font-size: 14px;
          color: #6b7280;
        }

        .date-info {
          text-align: right;
        }

        .date-label {
          font-size: 12px;
          color: #6b7280;
        }

        .date-value {
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 10px;
        }

        .separator {
          border-top: 1px solid #e5e7eb;
          margin: 20px 0;
        }

        .parties {
          display: flex;
          justify-content: space-between;
          margin-bottom: 30px;
        }

        .party {
          flex: 1;
        }

        .party h3 {
          font-size: 12px;
          font-weight: 600;
          color: #6b7280;
          margin-bottom: 8px;
          letter-spacing: 0.5px;
        }

        .party-info {
          font-size: 12px;
          line-height: 1.6;
        }

        .party-info .name {
          font-weight: 600;
          color: #111827;
        }

        .party-info p {
          color: #374151;
          margin: 2px 0;
        }

        .payment-info {
          display: flex;
          gap: 40px;
          margin-bottom: 20px;
          font-size: 12px;
        }

        .payment-info span {
          color: #6b7280;
        }

        .payment-info strong {
          color: #111827;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }

        thead {
          border-bottom: 2px solid #d1d5db;
        }

        th {
          text-align: left;
          padding: 12px 8px;
          font-size: 12px;
          font-weight: 600;
          color: #374151;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        th.right {
          text-align: right;
        }

        tbody tr {
          border-bottom: 1px solid #e5e7eb;
        }

        td {
          padding: 12px 8px;
          font-size: 12px;
          color: #111827;
        }

        td.right {
          text-align: right;
        }

        td.description {
          color: #6b7280;
        }

        .totals {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 30px;
        }

        .totals-table {
          width: 300px;
        }

        .totals-row {
          display: flex;
          justify-content: space-between;
          padding: 6px 0;
          font-size: 12px;
        }

        .totals-row.total {
          font-size: 14px;
          font-weight: bold;
          border-top: 1px solid #e5e7eb;
          padding-top: 12px;
          margin-top: 6px;
        }

        .totals-row.balance {
          background: #f3f4f6;
          padding: 12px;
          border-radius: 6px;
          margin-top: 8px;
          font-size: 14px;
          font-weight: bold;
        }

        .totals-row.balance .amount {
          color: #2563eb;
        }

        .totals-label {
          color: #6b7280;
        }

        .totals-amount {
          font-weight: 600;
        }

        .discount {
          color: #dc2626;
        }

        .notes-section {
          margin-bottom: 20px;
        }

        .notes-section h3 {
          font-size: 12px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 8px;
          letter-spacing: 0.5px;
        }

        .notes-section p {
          font-size: 12px;
          color: #6b7280;
          white-space: pre-wrap;
          line-height: 1.6;
        }

        .footer {
          text-align: center;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          margin-top: 30px;
        }

        .footer p {
          font-size: 10px;
          color: #9ca3af;
        }
      </style>
    </head>
    <body>
      <div class="invoice-container">
        <!-- Header -->
        <div class="header">
          <div>
            <h1>INVOICE</h1>
            <p class="invoice-number">#${invoice.invoiceNumber}</p>
          </div>
          <div class="date-info">
            <p class="date-label">Invoice Date</p>
            <p class="date-value">${formatDate(invoice.date)}</p>
            <p class="date-label">Due Date</p>
            <p class="date-value">${formatDate(invoice.dueDate)}</p>
          </div>
        </div>

        <div class="separator"></div>

        <!-- From and Bill To -->
        <div class="parties">
          <div class="party">
            <h3>FROM</h3>
            <div class="party-info">
              ${invoice.fromName ? `<p class="name">${invoice.fromName}</p>` : ""}
              ${invoice.fromAddress ? `<p>${invoice.fromAddress}</p>` : ""}
              ${
                invoice.fromCity || invoice.fromState || invoice.fromZip
                  ? `<p>${[invoice.fromCity, invoice.fromState, invoice.fromZip]
                      .filter(Boolean)
                      .join(", ")}</p>`
                  : ""
              }
              ${invoice.fromCountry ? `<p>${invoice.fromCountry}</p>` : ""}
              ${invoice.fromPhone ? `<p>${invoice.fromPhone}</p>` : ""}
              ${invoice.fromEmail ? `<p>${invoice.fromEmail}</p>` : ""}
              ${invoice.fromWebsite ? `<p>${invoice.fromWebsite}</p>` : ""}
            </div>
          </div>

          <div class="party">
            <h3>BILL TO</h3>
            <div class="party-info">
              ${invoice.billToName ? `<p class="name">${invoice.billToName}</p>` : ""}
              ${invoice.billToCompany ? `<p>${invoice.billToCompany}</p>` : ""}
              ${invoice.billToAddress ? `<p>${invoice.billToAddress}</p>` : ""}
              ${
                invoice.billToCity || invoice.billToState || invoice.billToZip
                  ? `<p>${[invoice.billToCity, invoice.billToState, invoice.billToZip]
                      .filter(Boolean)
                      .join(", ")}</p>`
                  : ""
              }
              ${invoice.billToCountry ? `<p>${invoice.billToCountry}</p>` : ""}
              ${invoice.billToPhone ? `<p>${invoice.billToPhone}</p>` : ""}
              ${invoice.billToEmail ? `<p>${invoice.billToEmail}</p>` : ""}
            </div>
          </div>
        </div>

        <!-- Payment Terms & PO -->
        ${
          invoice.paymentTerms || invoice.poNumber
            ? `
        <div class="payment-info">
          ${
            invoice.paymentTerms
              ? `<div><span>Payment Terms: </span><strong>${invoice.paymentTerms}</strong></div>`
              : ""
          }
          ${
            invoice.poNumber
              ? `<div><span>PO Number: </span><strong>${invoice.poNumber}</strong></div>`
              : ""
          }
        </div>
        `
            : ""
        }

        <div class="separator"></div>

        <!-- Items Table -->
        <table>
          <thead>
            <tr>
              <th style="width: 25%">ITEM</th>
              <th style="width: 35%">DESCRIPTION</th>
              <th class="right" style="width: 12%">QTY</th>
              <th class="right" style="width: 14%">RATE</th>
              <th class="right" style="width: 14%">AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.items
              .map(
                (item: InvoiceItem) => `
              <tr>
                <td>${item.name}</td>
                <td class="description">${item.description || "-"}</td>
                <td class="right">${item.quantity}</td>
                <td class="right">${formatCurrency(item.rate)}</td>
                <td class="right"><strong>${formatCurrency(item.amount)}</strong></td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>

        <!-- Totals -->
        <div class="totals">
          <div class="totals-table">
            <div class="totals-row">
              <span class="totals-label">Subtotal:</span>
              <span class="totals-amount">${formatCurrency(subtotal)}</span>
            </div>

            ${
              invoice.discount > 0
                ? `
            <div class="totals-row">
              <span class="totals-label">Discount (${
                invoice.discountType === "PERCENTAGE" ? `${invoice.discount}%` : "Fixed"
              }):</span>
              <span class="totals-amount discount">-${formatCurrency(discountAmount)}</span>
            </div>
            `
                : ""
            }

            ${
              invoice.taxRate > 0
                ? `
            <div class="totals-row">
              <span class="totals-label">Tax (${invoice.taxRate}%):</span>
              <span class="totals-amount">${formatCurrency(taxAmount)}</span>
            </div>
            `
                : ""
            }

            ${
              invoice.shipping > 0
                ? `
            <div class="totals-row">
              <span class="totals-label">Shipping:</span>
              <span class="totals-amount">${formatCurrency(invoice.shipping)}</span>
            </div>
            `
                : ""
            }

            <div class="totals-row total">
              <span>Total:</span>
              <span>${formatCurrency(total)}</span>
            </div>

            <div class="totals-row balance">
              <span>Balance Due:</span>
              <span class="amount">${formatCurrency(total)}</span>
            </div>
          </div>
        </div>

        <!-- Notes -->
        ${
          invoice.notes
            ? `
        <div class="notes-section">
          <h3>NOTES</h3>
          <p>${invoice.notes}</p>
        </div>
        `
            : ""
        }

        <!-- Terms -->
        ${
          invoice.terms
            ? `
        <div class="notes-section">
          <h3>TERMS & CONDITIONS</h3>
          <p>${invoice.terms}</p>
        </div>
        `
            : ""
        }

        <!-- Footer -->
        <div class="footer">
          <p>Thank you for your business!</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
