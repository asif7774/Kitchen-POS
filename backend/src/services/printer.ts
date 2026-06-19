import { BrowserWindow } from 'electron';

interface KOTPrintItem {
  name: string;
  qty: number;
}

interface BillPrintPayload {
  bill_number: string;
  taxable_amount: number;
  cgst_amount: number;
  sgst_amount: number;
  discount_amount: number;
  total_amount: number;
  date?: string;
}

interface BillItemPrintPayload {
  name: string;
  qty: number;
  unit_price: number;
}

interface OutletSettings {
  outlet_name?: string;
  address?: string;
  gstin?: string;
}

const hiddenWindows = new Set<BrowserWindow>();

async function printHtml(htmlContent: string): Promise<void> {
  return new Promise((resolve, _reject) => {
    const win = new BrowserWindow({
      show: true,
      width: 400,
      height: 600,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      }
    });

    hiddenWindows.add(win);

    const cleanup = () => {
      if (!win.isDestroyed()) {
        win.close();
      }
      hiddenWindows.delete(win);
    };

    // Failsafe timeout set to 5 minutes (user might take time in print dialog)
    const timeout = setTimeout(() => {
      cleanup();
      resolve(); 
    }, 300000);

    win.webContents.once('did-finish-load', () => {
      win.webContents.print({ 
        silent: false, 
        printBackground: true,
        color: false,
        margins: { marginType: 'printableArea' } 
      }, (success, errorType) => {
        clearTimeout(timeout);
        if (!success) {
          console.error('Print failed:', errorType);
          // resolve anyway so we don't crash/hang the UI
          resolve(); 
        } else {
          resolve();
        }
        cleanup();
      });
    });

    void win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);
  });
}

export async function printKOT(items: KOTPrintItem[], tableName: string, orderNote: string): Promise<void> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        @page { margin: 0; }
        body { 
          font-family: 'Courier New', monospace; font-size: 14px; font-weight: bold; color: black; line-height: 1.3; 
          margin: 0; padding: 20px; background: #e5e7eb; display: flex; justify-content: center; min-height: 100vh; box-sizing: border-box; 
        }
        .receipt { width: 300px; background: #fff; padding: 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
        @media print {
          body { padding: 0; background: #fff; display: block; min-height: auto; }
          .receipt { width: 100%; padding: 0; box-shadow: none; margin: 0; max-width: none; }
        }
        .text-center { text-align: center; }
        .fw-bold { font-weight: bold; }
        .fs-large { font-size: 18px; }
        .divider { border-bottom: 2px dashed #000; margin: 10px 0; }
        .item { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 15px; }
        .note { margin-top: 10px; font-style: italic; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="receipt">
        <div class="text-center fw-bold fs-large">*** KOT ***</div>
        <div class="text-center fs-large mt-2">Table: ${tableName}</div>
        <div class="text-center mt-2">Date: ${new Date().toLocaleString()}</div>
        <div class="divider"></div>
        ${items.map(i => `<div class="item"><span>${i.qty} x ${i.name}</span></div>`).join('')}
        ${orderNote ? `<div class="divider"></div><div class="note">Note: ${orderNote}</div>` : ''}
        <div class="divider"></div>
        <div class="text-center">End of KOT</div>
      </div>
    </body>
    </html>
  `;
  
  await printHtml(html);
}

export async function printBill(bill: BillPrintPayload, orderItems: BillItemPrintPayload[], settings: OutletSettings): Promise<void> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          @page { margin: 0; }
          body { 
            font-family: 'Courier New', monospace; font-size: 13px; font-weight: bold; color: black; line-height: 1.3; 
            margin: 0; padding: 20px; background: #e5e7eb; display: flex; justify-content: center; min-height: 100vh; box-sizing: border-box; 
          }
          .receipt { width: 300px; background: #fff; padding: 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
          @media print {
            body { padding: 0; background: #fff; display: block; min-height: auto; }
            .receipt { width: 100%; padding: 0; box-shadow: none; margin: 0; max-width: none; }
          }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .fw-bold { font-weight: bold; }
          .fs-large { font-size: 18px; }
          .divider { border-bottom: 2px dashed #000; margin: 10px 0; }
          .item { display: flex; justify-content: space-between; margin-bottom: 4px; }
          .item-name { flex: 1; padding-right: 10px; }
          .item-qty { width: 40px; text-align: left; }
          .item-total { width: 80px; text-align: right; }
          .summary-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
        </style>
      </head>
    <body>
      <div class="receipt">
        <div class="text-center fw-bold fs-large">${settings.outlet_name ?? 'Restaurant POS'}</div>
        ${settings.address ? `<div class="text-center">${settings.address}</div>` : ''}
        <div class="text-center">GSTIN: ${settings.gstin ?? 'N/A'}</div>
        <div class="divider"></div>
        <div>Bill: ${bill.bill_number}</div>
        <div>Date: ${bill.date ? new Date(`${bill.date}Z`).toLocaleString() : new Date().toLocaleString()}</div>
        <div class="divider"></div>
        
        ${orderItems.map(i => `
          <div class="item">
            <span class="item-name">${i.name}</span>
            <span class="item-qty">${i.qty}x</span>
            <span class="item-total">₹${(i.qty * i.unit_price).toFixed(2)}</span>
          </div>
        `).join('')}
        
        <div class="divider"></div>
        <div class="summary-row"><span>Subtotal:</span><span>₹${bill.taxable_amount.toFixed(2)}</span></div>
        <div class="summary-row"><span>CGST:</span><span>₹${bill.cgst_amount.toFixed(2)}</span></div>
        <div class="summary-row"><span>SGST:</span><span>₹${bill.sgst_amount.toFixed(2)}</span></div>
        ${bill.discount_amount > 0 ? `<div class="summary-row"><span>Discount:</span><span>-₹${bill.discount_amount.toFixed(2)}</span></div>` : ''}
        <div class="divider"></div>
        <div class="summary-row fw-bold fs-large"><span>GRAND TOTAL:</span><span>₹${bill.total_amount.toFixed(2)}</span></div>
        <div class="divider"></div>
        <div class="text-center fw-bold">Thank You! Visit Again.</div>
      </div>
    </body>
    </html>
  `;

  await printHtml(html);
}
