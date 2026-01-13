export interface Medication {
  id: string;
  name: string;
  category?: string;
  pharmacy?: string;
  price?: number;
  unit?: string;
}

export interface CalculationInput {
  amountPaid: number;
  medicationDispensed: number;
  medicationUnit: string;
  weeksPaid: number;
  weeksReceived: number;
  notes?: string;
}

export interface CalculationResult {
  id: string;
  input: CalculationInput;
  costPerWeek: number;
  costPerUnit: number;
  medicationPerWeek: number;
  weeklyCostPerUnit: number;
  refundAmount: number;
  timestamp: number;
}

export interface MedicationCalculation extends CalculationResult {
  medication: Medication;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  result: CalculationResult;
}

export interface Template {
  id: string;
  name: string;
  input: CalculationInput;
  createdAt: number;
}

export interface Statistics {
  totalRefunds: number;
  averageRefund: number;
  totalCalculations: number;
  mostUsedMedication?: string;
}
