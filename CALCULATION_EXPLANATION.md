# How Refund Calculations Work - Source Code Explanation

This document explains how the refund calculations are performed based on the actual source code in this project.

## Core Calculation Function

The main calculation logic is located in **`lib/utils.ts`** in the `calculateRefund()` function:

```typescript
export function calculateRefund(input: CalculationInput): CalculationResult
```

### Input Structure

The function accepts a `CalculationInput` object (defined in `types/index.ts`):

```typescript
interface CalculationInput {
  amountPaid: number;           // Total amount paid by the patient
  medicationDispensed: number;   // Amount of medication/service received
  medicationUnit: string;        // Unit of measurement (mg, ml, units, etc.)
  weeksPaid: number;            // Number of weeks the patient paid for
  weeksReceived: number;        // Number of weeks actually received
  notes?: string;               // Optional notes
}
```

## Step-by-Step Calculation Process

### 1. Extract Input Values
```typescript
const { amountPaid, medicationDispensed, weeksPaid, weeksReceived } = input;
```

### 2. Calculate Cost Per Week
```typescript
const costPerWeek = weeksPaid > 0 ? amountPaid / weeksPaid : 0;
```
- **Formula:** `Cost Per Week = Total Amount Paid ÷ Weeks Paid`
- **Safety check:** Prevents division by zero (returns 0 if weeksPaid is 0)

**Example:** If you paid $240 for 12 weeks:
- Cost per Week = $240 ÷ 12 = $20/week

### 3. Calculate Cost Per Unit
```typescript
const costPerUnit = medicationDispensed > 0 ? amountPaid / medicationDispensed : 0;
```
- **Formula:** `Cost Per Unit = Total Amount Paid ÷ Medication Dispensed`
- **Safety check:** Prevents division by zero

**Example:** If you paid $240 for 100mg:
- Cost per Unit = $240 ÷ 100 = $2.40 per mg

### 4. Calculate Medication Per Week
```typescript
const medicationPerWeek = weeksPaid > 0 ? medicationDispensed / weeksPaid : 0;
```
- **Formula:** `Medication Per Week = Medication Dispensed ÷ Weeks Paid`
- Shows the rate of medication distribution

**Example:** If you received 100mg over 12 weeks:
- Medication per Week = 100mg ÷ 12 = 8.33 mg/week

### 5. Calculate Weekly Cost Per Unit
```typescript
const weeklyCostPerUnit = medicationPerWeek > 0 ? costPerWeek / medicationPerWeek : 0;
```
- **Formula:** `Weekly Cost Per Unit = Cost Per Week ÷ Medication Per Week`
- Shows the cost efficiency per unit per week

**Example:** If cost per week is $20 and medication per week is 8.33mg:
- Weekly Cost per Unit = $20 ÷ 8.33 = $2.40 per mg per week

### 6. Calculate Refund Amount (Main Calculation)
```typescript
const refundAmount = weeksReceived >= weeksPaid 
  ? 0 
  : (weeksPaid - weeksReceived) * costPerWeek;
```
- **Condition:** If weeks received is greater than or equal to weeks paid, refund is $0
- **Formula:** `Refund = (Weeks Paid - Weeks Received) × Cost Per Week`
- **Safety:** Ensures refund is never negative using `Math.max(0, refundAmount)`

**Example:** 
- Paid for 12 weeks, received 8 weeks
- Cost per Week = $20
- Weeks Not Received = 12 - 8 = 4 weeks
- Refund = 4 × $20 = **$80**

### 7. Return Calculation Result
```typescript
return {
  id: Date.now().toString(),
  input,                    // Original input data
  costPerWeek,              // Calculated cost per week
  costPerUnit,              // Calculated cost per unit
  medicationPerWeek,        // Medication distribution rate
  weeklyCostPerUnit,        // Cost efficiency metric
  refundAmount: Math.max(0, refundAmount),  // Final refund (never negative)
  timestamp: Date.now(),    // When calculation was performed
};
```

## How It's Used in the Application

### In `app/page.tsx` - Main Calculation Handler

```typescript
const handleCalculate = () => {
  if (formData.amountPaid > 0 && formData.weeksPaid > 0) {
    const calculation = calculateRefund(formData);
    setResult(calculation);
    // ... save to history
  }
};
```

**Validation:** Only calculates if:
- `amountPaid > 0` (user entered a payment amount)
- `weeksPaid > 0` (user entered a duration)

### Input Parsing Utilities

The application includes helper functions to parse user input:

#### `parseWeeks(value: string): number`
```typescript
const match = value.match(/(\d+(?:\.\d+)?)/);
return match ? parseFloat(match[1]) : 0;
```
- Extracts numeric value from strings like "12", "12 weeks", or "12w"
- Returns 0 if no number is found

#### `parseMedicationAmount(value: string)`
```typescript
const match = value.match(/(\d+(?:\.\d+)?)\s*(mg|g|ml|L|units?)?/i);
```
- Extracts amount and unit from strings like "100mg", "50ml", or "100"
- Automatically detects common units (mg, g, ml, L, units)

## Key Safety Features

1. **Division by Zero Protection:** All divisions check for zero denominators
2. **Non-Negative Refunds:** Uses `Math.max(0, refundAmount)` to ensure refunds are never negative
3. **Full Refund Logic:** If `weeksReceived >= weeksPaid`, refund is automatically $0
4. **Input Validation:** Only calculates when required fields have valid values

## Currency Formatting

The `formatCurrency()` function (also in `lib/utils.ts`) formats monetary values:

```typescript
export function formatCurrency(amount: number, currency: string = 'USD'): string
```

- Uses `Intl.NumberFormat` API for locale-specific formatting
- Supports multiple currencies (USD, EUR, GBP, CAD, AUD, JPY, CNY, INR, BRL, MXN)
- Always displays 2 decimal places
- Automatically uses appropriate currency symbols and formatting

## Summary

The refund calculation follows a straightforward formula:
1. Calculate the cost per week
2. Determine how many weeks were not received
3. Multiply: `Refund = Weeks Not Received × Cost Per Week`

All intermediate calculations (cost per unit, medication per week, etc.) are provided as additional insights, but the core refund amount is based solely on the time-based calculation: **(Weeks Paid - Weeks Received) × Cost Per Week**.

