// Mocking escpos since actual hardware is needed
// import escpos from 'escpos';
// import escposUsb from 'escpos-usb';
// escpos.USB = escposUsb;

export async function printKOT(items: any[], tableName: string, orderNote: string): Promise<void> {
  try {
    console.log(`Printing KOT for ${tableName}`);
    // const device  = new escpos.USB();
    // const printer = new escpos.Printer(device);
    // device.open(() => {
    //   printer.text('KOT').text(`Table: ${tableName}`).text(`Note: ${orderNote}`);
    //   items.forEach(i => printer.text(`${i.qty} x ${i.name}`));
    //   printer.cut().close();
    // });
    return Promise.resolve();
  } catch (e) {
    throw e;
  }
}

export async function printBill(bill: any, orderItems: any[], settings: any): Promise<void> {
  try {
    console.log(`Printing Bill ${bill.bill_number}`);
    // const device  = new escpos.USB();
    // const printer = new escpos.Printer(device);
    // device.open(() => {
    //   printer.text('RECEIPT').text(settings.outlet_name || 'Restaurant').text(settings.gstin || '');
    //   printer.text(`Bill: ${bill.bill_number}`);
    //   orderItems.forEach(i => printer.text(`${i.qty} x ${i.name}  ${i.unit_price}`));
    //   printer.text(`Total: ${bill.total_amount}`);
    //   printer.cut().close();
    // });
    return Promise.resolve();
  } catch (e) {
    throw e;
  }
}
