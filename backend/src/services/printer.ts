import escpos from 'escpos';
import escposUsb from 'escpos-usb';

// Bind USB adapter to escpos
(escpos as unknown as { USB: unknown }).USB = escposUsb;

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

export async function printKOT(items: KOTPrintItem[], tableName: string, orderNote: string): Promise<void> {
  try {
    const device = new escpos.USB();
    const printer = new escpos.Printer(device);
    
    return new Promise<void>((resolve, reject) => {
      device.open((err: unknown) => {
        if (err) {
          reject(err);
          return;
        }
        try {
          printer
            .align('ct')
            .size(2, 2)
            .text('KOT')
            .size(1, 1)
            .text(`Table: ${tableName}`)
            .text(`Date: ${new Date().toLocaleString()}`)
            .text('--------------------------------')
            .align('lt');
            
          items.forEach(item => {
            printer.text(`${item.qty} x ${item.name}`);
          });
          
          if (orderNote) {
            printer
              .text('--------------------------------')
              .text(`Note: ${orderNote}`);
          }
          
          printer
            .text('--------------------------------')
            .feed(2)
            .cut()
            .close();
            
          resolve();
        } catch (e) {
          reject(e);
        }
      });
    });
  } catch (_e: unknown) {
    // Robust Mock Fallback
    console.log('\n=== MOCK THERMAL PRINT SLIP (KOT) ===');
    console.log('====================================');
    console.log('              KOT SLIP              ');
    console.log('====================================');
    console.log(`Table: ${tableName.padEnd(14)} Time: ${new Date().toLocaleTimeString()}`);
    console.log('------------------------------------');
    items.forEach(i => {
      console.log(`${i.qty} x ${i.name}`);
    });
    if (orderNote) {
      console.log('------------------------------------');
      console.log(`Note: ${orderNote}`);
    }
    console.log('====================================\n');
    return Promise.resolve();
  }
}

export async function printBill(bill: BillPrintPayload, orderItems: BillItemPrintPayload[], settings: OutletSettings): Promise<void> {
  try {
    const device = new escpos.USB();
    const printer = new escpos.Printer(device);
    
    return new Promise<void>((resolve, reject) => {
      device.open((err: unknown) => {
        if (err) {
          reject(err);
          return;
        }
        try {
          printer
            .align('ct')
            .size(1.5, 1.5)
            .text(settings.outlet_name ?? 'Restaurant POS')
            .size(1, 1)
            .text(settings.address ?? '')
            .text(`GSTIN: ${settings.gstin ?? 'N/A'}`)
            .text('--------------------------------')
            .align('lt')
            .text(`Bill: ${bill.bill_number}`)
            .text(`Date: ${new Date().toLocaleString()}`)
            .text('--------------------------------');

          orderItems.forEach(item => {
            const amount = item.qty * item.unit_price;
            printer.text(`${item.qty} x ${item.name.padEnd(18)} ₹${amount.toFixed(2)}`);
          });

          printer
            .text('--------------------------------')
            .text(`Subtotal:      ₹${bill.taxable_amount.toFixed(2)}`)
            .text(`CGST:          ₹${bill.cgst_amount.toFixed(2)}`)
            .text(`SGST:          ₹${bill.sgst_amount.toFixed(2)}`);
            
          if (bill.discount_amount > 0) {
            printer.text(`Discount:     -₹${bill.discount_amount.toFixed(2)}`);
          }

          printer
            .text('--------------------------------')
            .size(1.2, 1.2)
            .text(`GRAND TOTAL:   ₹${bill.total_amount.toFixed(2)}`)
            .size(1, 1)
            .text('--------------------------------')
            .align('ct')
            .text('Thank You! Visit Again.')
            .feed(2)
            .cut()
            .close();

          resolve();
        } catch (e) {
          reject(e);
        }
      });
    });
  } catch (_e: unknown) {
    // Robust Mock Fallback
    console.log('\n=== MOCK THERMAL PRINT SLIP (BILL) ===');
    console.log('====================================');
    console.log((settings.outlet_name ?? 'Restaurant POS').toUpperCase().padStart(26));
    if (settings.address) {console.log(settings.address.padStart(26));}
    console.log(`GSTIN: ${settings.gstin ?? 'N/A'}`.padStart(26));
    console.log('====================================');
    console.log(`Invoice: ${bill.bill_number.padEnd(14)} Time: ${new Date().toLocaleTimeString()}`);
    console.log('------------------------------------');
    orderItems.forEach(i => {
      const amt = i.qty * i.unit_price;
      console.log(`${i.qty} x ${i.name.padEnd(20)} ₹${amt.toFixed(2)}`);
    });
    console.log('------------------------------------');
    console.log(`Subtotal:             ₹${bill.taxable_amount.toFixed(2)}`);
    console.log(`CGST:                 ₹${bill.cgst_amount.toFixed(2)}`);
    console.log(`SGST:                 ₹${bill.sgst_amount.toFixed(2)}`);
    if (bill.discount_amount > 0) {
      console.log(`Discount:            -₹${bill.discount_amount.toFixed(2)}`);
    }
    console.log('------------------------------------');
    console.log(`GRAND TOTAL:          ₹${bill.total_amount.toFixed(2)}`);
    console.log('====================================');
    console.log('       THANK YOU! VISIT AGAIN.      ');
    console.log('====================================\n');
    return Promise.resolve();
  }
}
