const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const filePath = path.join(__dirname, '..', 'Membership Payment Breakdowns Itemized Receipts (4).xlsx');

try {
  const workbook = XLSX.readFile(filePath);
  
  console.log('Sheet names:', workbook.SheetNames);
  console.log('\n');
  
  // Read all sheets
  workbook.SheetNames.forEach(sheetName => {
    console.log(`\n=== Sheet: ${sheetName} ===`);
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { defval: null });
    
    console.log(`Rows: ${data.length}`);
    if (data.length > 0) {
      console.log('Columns:', Object.keys(data[0]));
      console.log('\nFirst 10 rows:');
      console.log(JSON.stringify(data.slice(0, 10), null, 2));
    }
  });
} catch (error) {
  console.error('Error reading spreadsheet:', error.message);
}

