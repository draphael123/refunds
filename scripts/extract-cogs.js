const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const filePath = path.join(__dirname, '..', 'Membership Payment Breakdowns Itemized Receipts (4).xlsx');
const workbook = XLSX.readFile(filePath);
const sheet = workbook.Sheets['NEW COGS'];
const data = XLSX.utils.sheet_to_json(sheet);

// Clean and structure the data
const cogsData = data
  .filter(row => row.Treatment && row['PAYMENT TERM'])
  .map(row => ({
    treatment: row.Treatment || '',
    paymentTerm: row['PAYMENT TERM'] || '',
    rxDetails: row['Rx Details'] || '',
    pharmacy: row.Pharmacy || '',
    perShipmentCost: typeof row['Per Shipment Cost'] === 'number' ? row['Per Shipment Cost'] : 0,
    shipping: typeof row.Shipping === 'number' ? row.Shipping : 0,
    dispensing: typeof row.Dispensing === 'number' ? row.Dispensing : 0,
    total: typeof row.TOTAL === 'number' ? row.TOTAL : 0,
  }));

console.log(JSON.stringify(cogsData, null, 2));
console.log(`\nTotal records: ${cogsData.length}`);

