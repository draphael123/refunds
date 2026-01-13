import { CalculationInput, CalculationResult } from '@/types';

export function calculateRefund(input: CalculationInput): CalculationResult {
  const { amountPaid, medicationDispensed, weeksPaid, weeksReceived } = input;
  
  const costPerWeek = weeksPaid > 0 ? amountPaid / weeksPaid : 0;
  const costPerUnit = medicationDispensed > 0 ? amountPaid / medicationDispensed : 0;
  const medicationPerWeek = weeksPaid > 0 ? medicationDispensed / weeksPaid : 0;
  const weeklyCostPerUnit = medicationPerWeek > 0 ? costPerWeek / medicationPerWeek : 0;
  
  const refundAmount = weeksReceived >= weeksPaid 
    ? 0 
    : (weeksPaid - weeksReceived) * costPerWeek;
  
  return {
    id: Date.now().toString(),
    input,
    costPerWeek,
    costPerUnit,
    medicationPerWeek,
    weeklyCostPerUnit,
    refundAmount: Math.max(0, refundAmount),
    timestamp: Date.now(),
  };
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  const currencyMap: { [key: string]: string } = {
    'USD': 'en-US',
    'EUR': 'de-DE',
    'GBP': 'en-GB',
    'CAD': 'en-CA',
    'AUD': 'en-AU',
    'JPY': 'ja-JP',
    'CNY': 'zh-CN',
    'INR': 'en-IN',
    'BRL': 'pt-BR',
    'MXN': 'es-MX',
  };
  
  const locale = currencyMap[currency] || 'en-US';
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function parseWeeks(value: string): number {
  const match = value.match(/(\d+(?:\.\d+)?)/);
  return match ? parseFloat(match[1]) : 0;
}

export function parseMedicationAmount(value: string): { amount: number; unit: string } {
  const match = value.match(/(\d+(?:\.\d+)?)\s*(mg|g|ml|L|units?)?/i);
  if (match) {
    return {
      amount: parseFloat(match[1]),
      unit: match[2]?.toLowerCase() || 'units',
    };
  }
  return { amount: 0, unit: 'units' };
}

export function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

export function calculateProfitMargin(amountPaid: number, cogsTotal: number): number {
  if (amountPaid === 0) return 0;
  return ((amountPaid - cogsTotal) / amountPaid) * 100;
}

export function calculateProfit(amountPaid: number, cogsTotal: number): number {
  return amountPaid - cogsTotal;
}
