import { CalculationResult, HistoryItem, Template } from '@/types';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export function exportToCSV(history: HistoryItem[], currency: string = 'USD'): void {
  const headers = ['Date', 'Amount Paid', 'Weeks Paid', 'Weeks Received', 'Refund Amount', 'Cost Per Week', 'Notes'];
  const rows = history.map(item => [
    new Date(item.timestamp).toLocaleString(),
    item.result.input.amountPaid.toFixed(2),
    item.result.input.weeksPaid.toString(),
    item.result.input.weeksReceived.toString(),
    item.result.refundAmount.toFixed(2),
    item.result.costPerWeek.toFixed(2),
    item.result.input.notes || ''
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `refund-calculations-${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
}

export function exportToPDF(result: CalculationResult, currency: string = 'USD'): void {
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text('Refund Calculation Report', 14, 22);
  
  doc.setFontSize(12);
  let y = 35;
  
  doc.text(`Date: ${new Date(result.timestamp).toLocaleString()}`, 14, y);
  y += 10;
  
  doc.text(`Amount Paid: ${currency} ${result.input.amountPaid.toFixed(2)}`, 14, y);
  y += 8;
  doc.text(`Weeks Paid: ${result.input.weeksPaid}`, 14, y);
  y += 8;
  doc.text(`Weeks Received: ${result.input.weeksReceived}`, 14, y);
  y += 8;
  doc.text(`Medication Dispensed: ${result.input.medicationDispensed} ${result.input.medicationUnit}`, 14, y);
  y += 15;
  
  doc.setFontSize(14);
  doc.text('Calculation Results', 14, y);
  y += 10;
  
  doc.setFontSize(12);
  const tableData = [
    ['Cost per Week', `${currency} ${result.costPerWeek.toFixed(2)}`],
    ['Cost per Unit', `${currency} ${result.costPerUnit.toFixed(2)}`],
    ['Medication per Week', `${result.medicationPerWeek.toFixed(2)} ${result.input.medicationUnit}`],
    ['Refund Amount', `${currency} ${result.refundAmount.toFixed(2)}`],
  ];
  
  (doc as any).autoTable({
    startY: y,
    head: [['Metric', 'Value']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [37, 99, 235] },
  });
  
  if (result.input.notes) {
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.text('Notes:', 14, finalY);
    doc.text(result.input.notes, 14, finalY + 8);
  }
  
  doc.save(`refund-calculation-${new Date().toISOString().split('T')[0]}.pdf`);
}

export function exportHistoryToCSV(history: HistoryItem[]): void {
  exportToCSV(history);
}

export function exportAllData(history: HistoryItem[], templates: Template[]): string {
  const data = {
    history,
    templates,
    exportDate: new Date().toISOString(),
    version: '1.0'
  };
  return JSON.stringify(data, null, 2);
}

