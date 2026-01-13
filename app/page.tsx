'use client';

import { useState, useEffect } from 'react';
import { CalculationInput, CalculationResult, Medication, HistoryItem, Template, Statistics } from '@/types';
import { calculateRefund, formatCurrency, parseWeeks, parseMedicationAmount, generateId } from '@/lib/utils';
import { medications } from '@/lib/medications';

export default function Home() {
  const [darkMode, setDarkMode] = useState(false);
  const [currency, setCurrency] = useState('USD');
  const [formData, setFormData] = useState<CalculationInput>({
    amountPaid: 0,
    medicationDispensed: 0,
    medicationUnit: 'units',
    weeksPaid: 0,
    weeksReceived: 0,
    notes: '',
  });
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedMedications, setSelectedMedications] = useState<Array<Medication & { calculation: CalculationResult }>>([]);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [medicationFilter, setMedicationFilter] = useState('');
  const [showMedicationModal, setShowMedicationModal] = useState(false);

  useEffect(() => {
    const isDark = localStorage.getItem('darkMode') === 'true';
    setDarkMode(isDark);
    document.documentElement.classList.toggle('dark', isDark);
    
    const savedHistory = localStorage.getItem('calculationHistory');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
    
    const savedTemplates = localStorage.getItem('templates');
    if (savedTemplates) {
      setTemplates(JSON.parse(savedTemplates));
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', String(newMode));
    document.documentElement.classList.toggle('dark', newMode);
  };

  const handleCalculate = () => {
    if (formData.amountPaid > 0 && formData.weeksPaid > 0) {
      const calculation = calculateRefund(formData);
      setResult(calculation);
      
      const newHistoryItem: HistoryItem = {
        id: generateId(),
        timestamp: Date.now(),
        result: calculation,
      };
      
      const updatedHistory = [newHistoryItem, ...history].slice(0, 10);
      setHistory(updatedHistory);
      localStorage.setItem('calculationHistory', JSON.stringify(updatedHistory));
    }
  };

  const handleClear = () => {
    setFormData({
      amountPaid: 0,
      medicationDispensed: 0,
      medicationUnit: 'units',
      weeksPaid: 0,
      weeksReceived: 0,
      notes: '',
    });
    setResult(null);
  };

  const handleSaveTemplate = () => {
    const templateName = prompt('Enter template name:');
    if (templateName && result) {
      const newTemplate: Template = {
        id: generateId(),
        name: templateName,
        input: formData,
        createdAt: Date.now(),
      };
      const updatedTemplates = [...templates, newTemplate];
      setTemplates(updatedTemplates);
      localStorage.setItem('templates', JSON.stringify(updatedTemplates));
    }
  };

  const loadTemplate = (template: Template) => {
    setFormData(template.input);
  };

  const loadHistoryItem = (item: HistoryItem) => {
    setFormData(item.result.input);
    setResult(item.result);
  };

  const addMedication = (medication: Medication) => {
    const medInput: CalculationInput = {
      amountPaid: medication.price || 0,
      medicationDispensed: 0,
      medicationUnit: medication.unit || 'units',
      weeksPaid: 0,
      weeksReceived: 0,
    };
    const medResult = calculateRefund(medInput);
    setSelectedMedications([...selectedMedications, { ...medication, calculation: medResult }]);
    setShowMedicationModal(false);
  };

  const getStatistics = (): Statistics => {
    const allRefunds = history.map(h => h.result.refundAmount);
    const totalRefunds = allRefunds.reduce((sum, r) => sum + r, 0);
    const averageRefund = allRefunds.length > 0 ? totalRefunds / allRefunds.length : 0;
    
    return {
      totalRefunds,
      averageRefund,
      totalCalculations: history.length,
    };
  };

  const stats = getStatistics();
  const totalMedicationRefund = selectedMedications.reduce((sum, m) => sum + m.calculation.refundAmount, 0);
  const totalRefundAmount = (result?.refundAmount || 0) + totalMedicationRefund;

  const filteredMedications = medications.filter(med => 
    med.name.toLowerCase().includes(medicationFilter.toLowerCase()) ||
    med.category?.toLowerCase().includes(medicationFilter.toLowerCase()) ||
    med.pharmacy?.toLowerCase().includes(medicationFilter.toLowerCase())
  );

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">💊 Refund Converter</h1>
            <p className="text-gray-600 dark:text-gray-400">
              ✨ Process accurate refunds for patients who are due them
            </p>
          </div>
          <button
            onClick={toggleDarkMode}
            className="text-2xl p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
            aria-label="Toggle dark mode"
          >
            🌙
          </button>
        </header>

        {/* Info Section */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <p className="text-sm">
            <strong>Refund Eligibility:</strong><br />
            * <strong>Assessment Fees:</strong> Patients can always get refunds for their assessment fee<br />
            * <strong>Expanded Labs, Getlabs Fees, and Subscription Fees:</strong> Refunds are more complicated and depend on specific circumstances
          </p>
        </div>

        {/* Instructions */}
        <div className="mb-6">
          <button
            onClick={() => setShowInstructions(!showInstructions)}
            className="text-lg font-semibold mb-2"
          >
            📖 Show Instructions {showInstructions ? '▼' : '▶'}
          </button>
          {showInstructions && (
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-4">
              <h3 className="font-bold mb-2">How to Use</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li><strong>Enter the Amount Paid:</strong> Enter the total amount paid (e.g., 100.00).</li>
                <li><strong>Enter Medication/Service Dispensed:</strong> Enter the amount of medication or service received.</li>
                <li><strong>Enter Weeks Paid:</strong> Enter the number of weeks you paid for.</li>
                <li><strong>Enter Weeks Received:</strong> Enter the number of weeks of medication/service you actually received.</li>
                <li><strong>Click Calculate:</strong> Click the "Calculate" button to see your results.</li>
              </ol>
            </div>
          )}
        </div>

        {/* Main Form */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4">📊 Live Preview</h2>
            <div className="mb-4 p-4 bg-gray-100 dark:bg-gray-700 rounded">
              <p className="text-sm text-gray-600 dark:text-gray-400">Estimated Refund:</p>
              <p className="text-2xl font-bold">{formatCurrency(totalRefundAmount, currency)}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Cost per Week: {formatCurrency(result?.costPerWeek || 0, currency)}</p>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleCalculate(); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Amount Paid ($) ℹ️
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amountPaid || ''}
                  onChange={(e) => setFormData({ ...formData, amountPaid: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Amount of Medication Dispensed ℹ️
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.medicationDispensed || ''}
                    onChange={(e) => {
                      const parsed = parseMedicationAmount(e.target.value);
                      setFormData({ ...formData, medicationDispensed: parsed.amount, medicationUnit: parsed.unit });
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                    placeholder="e.g., 100mg, 50ml, 100"
                  />
                  <select
                    value={formData.medicationUnit}
                    onChange={(e) => setFormData({ ...formData, medicationUnit: e.target.value })}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                  >
                    <option value="mg">mg</option>
                    <option value="g">g</option>
                    <option value="ml">ml</option>
                    <option value="L">L</option>
                    <option value="units">units</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Number of Weeks Paid ℹ️
                </label>
                <input
                  type="text"
                  value={formData.weeksPaid || ''}
                  onChange={(e) => setFormData({ ...formData, weeksPaid: parseWeeks(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., 12 or 12 weeks"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Number of Weeks Received ℹ️
                </label>
                <input
                  type="text"
                  value={formData.weeksReceived || ''}
                  onChange={(e) => setFormData({ ...formData, weeksReceived: parseWeeks(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., 8 or 8 weeks"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Calculation Notes (Optional) ℹ️
                </label>
                <textarea
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded"
                >
                  Calculate
                </button>
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Clear
                </button>
              </div>
            </form>

            {/* Medication Selection */}
            <div className="mt-6">
              <button
                onClick={() => setShowMedicationModal(true)}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded"
              >
                ➕ Add Medication
              </button>
            </div>
          </div>

          {/* Results Panel */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4">💰 Refund Results</h2>
            
            {result && (
              <div className="space-y-4">
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Refund Amount</p>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(totalRefundAmount, currency)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Based on your calculation</p>
                </div>

                <div className="space-y-2">
                  <p><strong>Cost per Week:</strong> {formatCurrency(result.costPerWeek, currency)}</p>
                  <p><strong>Cost per Unit of Medication:</strong> {formatCurrency(result.costPerUnit, currency)}</p>
                  <p><strong>Medication per Week:</strong> {result.medicationPerWeek.toFixed(2)} {formData.medicationUnit}</p>
                  <p><strong>Total Weekly Cost per Unit:</strong> {formatCurrency(result.weeklyCostPerUnit, currency)}</p>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-bold mb-2">Projections</h3>
                  <div className="space-y-1 text-sm">
                    <p>Cost for 1 Month (4 weeks): {formatCurrency(result.costPerWeek * 4, currency)}</p>
                    <p>Cost for 3 Months (12 weeks): {formatCurrency(result.costPerWeek * 12, currency)}</p>
                    <p>Cost for 6 Months (24 weeks): {formatCurrency(result.costPerWeek * 24, currency)}</p>
                    <p>Cost for 1 Year (52 weeks): {formatCurrency(result.costPerWeek * 52, currency)}</p>
                  </div>
                </div>
              </div>
            )}

            {!result && (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                Enter values and click Calculate to see results
              </p>
            )}
          </div>
        </div>

        {/* Medication Modal */}
        {showMedicationModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Medications from Spreadsheet</h2>
                <button
                  onClick={() => setShowMedicationModal(false)}
                  className="text-2xl"
                >
                  ✕
                </button>
              </div>
              <input
                type="text"
                placeholder="Filter Medications..."
                value={medicationFilter}
                onChange={(e) => setMedicationFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white mb-4"
              />
              <div className="space-y-2">
                {filteredMedications.map((med) => (
                  <div
                    key={med.id}
                    onClick={() => addMedication(med)}
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                  >
                    <p className="font-semibold">{med.name}</p>
                    {med.category && <p className="text-sm text-gray-500">{med.category}</p>}
                    {med.price && <p className="text-sm">{formatCurrency(med.price, currency)}</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Selected Medications */}
        {selectedMedications.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4">💊 Medication Refunds</h2>
            <div className="space-y-4">
              {selectedMedications.map((med, index) => (
                <div key={index} className="border border-gray-200 dark:border-gray-700 rounded p-4">
                  <p className="font-semibold">{med.name}</p>
                  <p>Refund: {formatCurrency(med.calculation.refundAmount, currency)}</p>
                </div>
              ))}
              <div className="border-t pt-4">
                <p className="text-lg font-bold">Total Medication Refund: {formatCurrency(totalMedicationRefund, currency)}</p>
              </div>
            </div>
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Recent Calculations</h2>
              <button
                onClick={() => {
                  setHistory([]);
                  localStorage.removeItem('calculationHistory');
                }}
                className="text-sm text-red-600 hover:text-red-700"
              >
                Clear History
              </button>
            </div>
            <div className="space-y-2">
              {history.map((item) => (
                <div
                  key={item.id}
                  onClick={() => loadHistoryItem(item)}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                >
                  <p className="font-semibold">Refund: {formatCurrency(item.result.refundAmount, currency)}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(item.timestamp).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Templates */}
        {templates.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Saved Templates</h2>
              <button
                onClick={() => {
                  setTemplates([]);
                  localStorage.removeItem('templates');
                }}
                className="text-sm text-red-600 hover:text-red-700"
              >
                Clear All
              </button>
            </div>
            <div className="space-y-2">
              {templates.map((template) => (
                <div
                  key={template.id}
                  onClick={() => loadTemplate(template)}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                >
                  <p className="font-semibold">{template.name}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(template.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Statistics */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">📊 Statistics & Insights</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500">Total Refunds Calculated</p>
              <p className="text-2xl font-bold">{formatCurrency(stats.totalRefunds, currency)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Average Refund Amount</p>
              <p className="text-2xl font-bold">{formatCurrency(stats.averageRefund, currency)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Calculations</p>
              <p className="text-2xl font-bold">{stats.totalCalculations}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Most Used Medication</p>
              <p className="text-2xl font-bold">-</p>
            </div>
          </div>
        </div>

        {/* Help & FAQ */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="text-xl font-bold mb-4"
          >
            ❓ Help & FAQ {showHelp ? '▼' : '▶'}
          </button>
          {showHelp && (
            <div className="space-y-4 text-sm">
              <div>
                <h3 className="font-bold mb-2">How is my refund calculated?</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Your refund is calculated using: <strong>Refund = (Weeks Paid - Weeks Received) × Cost per Week</strong>
                </p>
              </div>
              <div>
                <h3 className="font-bold mb-2">Why is my refund $0.00?</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Your refund will be $0.00 if you received the full amount of medication/service (weeks received ≥ weeks paid).
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Currency Selector */}
        <div className="mt-6 flex justify-end">
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
          >
            <option value="USD">$ USD</option>
            <option value="EUR">€ EUR</option>
            <option value="GBP">£ GBP</option>
            <option value="CAD">C$ CAD</option>
            <option value="AUD">A$ AUD</option>
          </select>
        </div>
      </div>
    </div>
  );
}
