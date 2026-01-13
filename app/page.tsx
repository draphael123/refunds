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
  const [showSettings, setShowSettings] = useState(false);
  const [historyLimit, setHistoryLimit] = useState(10);

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

    const savedHistoryLimit = localStorage.getItem('historyLimit');
    if (savedHistoryLimit) {
      setHistoryLimit(parseInt(savedHistoryLimit));
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
      
      const updatedHistory = [newHistoryItem, ...history].slice(0, historyLimit);
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
    // Extract weeks from paymentTerm (e.g., "4WKS" -> 4, "12WKS" -> 12)
    const weeksMatch = medication.paymentTerm?.match(/(\d+)/);
    const weeksPaid = weeksMatch ? parseInt(weeksMatch[1]) : 0;
    
    // Extract amount from rxDetails if available
    const amountMatch = medication.rxDetails?.match(/(\d+(?:\.\d+)?)/);
    const medicationDispensed = amountMatch ? parseFloat(amountMatch[1]) : 0;
    
    const medInput: CalculationInput = {
      amountPaid: medication.price || medication.total || 0,
      medicationDispensed,
      medicationUnit: medication.unit || 'units',
      weeksPaid,
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
    <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">💊 Refund Converter</h1>
            <p className="text-blue-600 dark:text-blue-400">
              ✨ Process accurate refunds for patients who are due them
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="text-2xl p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
              aria-label="Settings"
              title="Settings"
            >
              ⚙️
            </button>
            <button
              onClick={toggleDarkMode}
              className="text-2xl p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
              aria-label="Toggle dark mode"
              title="Toggle dark mode"
            >
              🌙
            </button>
          </div>
        </header>

        {/* Settings Menu */}
        {showSettings && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowSettings(false)}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">⚙️ Settings</h2>
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-2xl hover:text-blue-600 dark:hover:text-blue-400"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                {/* Currency Settings */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Default Currency
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => {
                      setCurrency(e.target.value);
                      localStorage.setItem('defaultCurrency', e.target.value);
                    }}
                    className="w-full px-4 py-2 border border-blue-300 dark:border-blue-600 rounded dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="USD">$ USD</option>
                    <option value="EUR">€ EUR</option>
                    <option value="GBP">£ GBP</option>
                    <option value="CAD">C$ CAD</option>
                    <option value="AUD">A$ AUD</option>
                    <option value="JPY">¥ JPY</option>
                    <option value="CNY">¥ CNY</option>
                    <option value="INR">₹ INR</option>
                    <option value="BRL">R$ BRL</option>
                    <option value="MXN">$ MXN</option>
                  </select>
                </div>

                {/* Dark Mode Toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-medium">Dark Mode</label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Toggle dark/light theme</p>
                  </div>
                  <button
                    onClick={toggleDarkMode}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      darkMode ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        darkMode ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* History Limit */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    History Limit: {historyLimit}
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    value={historyLimit}
                    onChange={(e) => {
                      const limit = parseInt(e.target.value);
                      setHistoryLimit(limit);
                      localStorage.setItem('historyLimit', limit.toString());
                      // Update current history to match limit
                      const updatedHistory = history.slice(0, limit);
                      setHistory(updatedHistory);
                      localStorage.setItem('calculationHistory', JSON.stringify(updatedHistory));
                    }}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <span>5</span>
                    <span>50</span>
                  </div>
                </div>

                {/* Data Management */}
                <div className="border-t pt-4">
                  <h3 className="text-sm font-semibold mb-3">Data Management</h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        const data = {
                          history,
                          templates,
                          exportDate: new Date().toISOString(),
                          version: '1.0'
                        };
                        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                        const link = document.createElement('a');
                        link.href = URL.createObjectURL(blob);
                        link.download = `refund-calculator-backup-${new Date().toISOString().split('T')[0]}.json`;
                        link.click();
                      }}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded text-sm"
                    >
                      💾 Backup Data
                    </button>
                    <button
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = '.json';
                        input.onchange = (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              try {
                                const data = JSON.parse(event.target?.result as string);
                                if (data.history) setHistory(data.history);
                                if (data.templates) setTemplates(data.templates);
                                localStorage.setItem('calculationHistory', JSON.stringify(data.history || []));
                                localStorage.setItem('templates', JSON.stringify(data.templates || []));
                                alert('Data restored successfully!');
                              } catch (error) {
                                alert('Error restoring data. Please check the file format.');
                              }
                            };
                            reader.readAsText(file);
                          }
                        };
                        input.click();
                      }}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded text-sm"
                    >
                      📥 Restore Data
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
                          setHistory([]);
                          setTemplates([]);
                          localStorage.removeItem('calculationHistory');
                          localStorage.removeItem('templates');
                          alert('All data cleared.');
                        }
                      }}
                      className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded text-sm"
                    >
                      🗑️ Clear All Data
                    </button>
                  </div>
                </div>

                {/* About */}
                <div className="border-t pt-4">
                  <h3 className="text-sm font-semibold mb-2">About</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Refund Calculator v1.0<br />
                    Process accurate refunds for patients
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

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
            <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
              <p className="text-sm text-blue-700 dark:text-blue-300">Estimated Refund:</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(totalRefundAmount, currency)}</p>
              <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">Cost per Week: {formatCurrency(result?.costPerWeek || 0, currency)}</p>
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
                  className="w-full px-4 py-2 border border-blue-300 dark:border-blue-600 rounded dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Number of Weeks Paid ℹ️
                </label>
                <input
                  type="text"
                  value={formData.weeksPaid || ''}
                  onChange={(e) => setFormData({ ...formData, weeksPaid: parseWeeks(e.target.value) })}
                  className="w-full px-4 py-2 border border-blue-300 dark:border-blue-600 rounded dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  className="w-full px-4 py-2 border border-blue-300 dark:border-blue-600 rounded dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  className="w-full px-4 py-2 border border-blue-300 dark:border-blue-600 rounded dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  className="px-4 py-2 border border-blue-300 dark:border-blue-600 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                >
                  Clear
                </button>
              </div>
            </form>

            {/* Medication Selection */}
            <div className="mt-6">
              <button
                onClick={() => setShowMedicationModal(true)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded"
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
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-sm text-blue-700 dark:text-blue-300">Total Refund Amount</p>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {formatCurrency(totalRefundAmount, currency)}
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Based on your calculation</p>
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
                className="w-full px-4 py-2 border border-blue-300 dark:border-blue-600 rounded dark:bg-gray-700 dark:text-white mb-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <div className="space-y-2">
                {filteredMedications.length === 0 ? (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                    No medications found. {medications.length > 0 ? 'Try adjusting your filter.' : 'No medications available.'}
                  </p>
                ) : (
                  filteredMedications.map((med) => (
                  <div
                    key={med.id}
                    onClick={() => addMedication(med)}
                    className="p-4 border border-blue-200 dark:border-blue-700 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer"
                  >
                    <p className="font-semibold">{med.name}</p>
                    {med.pharmacy && <p className="text-sm text-blue-600 dark:text-blue-400">Pharmacy: {med.pharmacy}</p>}
                    {med.paymentTerm && <p className="text-sm text-gray-600 dark:text-gray-400">Payment Term: {med.paymentTerm}</p>}
                    {med.price && <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">Total: {formatCurrency(med.price, currency)}</p>}
                    {med.perShipmentCost !== undefined && (
                      <div className="text-xs text-gray-500 mt-1">
                        COGS: {formatCurrency(med.perShipmentCost, currency)} 
                        {med.shipping !== undefined && ` + Shipping: ${formatCurrency(med.shipping, currency)}`}
                        {med.dispensing !== undefined && ` + Dispensing: ${formatCurrency(med.dispensing, currency)}`}
                      </div>
                    )}
                  </div>
                  ))
                )}
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
                <div key={index} className="border border-blue-200 dark:border-blue-700 rounded p-4">
                  <p className="font-semibold">{med.name}</p>
                  {med.pharmacy && <p className="text-sm text-gray-600 dark:text-gray-400">Pharmacy: {med.pharmacy}</p>}
                  {med.paymentTerm && <p className="text-sm text-gray-600 dark:text-gray-400">Payment Term: {med.paymentTerm}</p>}
                  <div className="mt-2">
                    <p className="text-lg font-bold text-blue-600 dark:text-blue-400">Refund: {formatCurrency(med.calculation.refundAmount, currency)}</p>
                    {med.perShipmentCost !== undefined && (
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        <p>Total Paid: {formatCurrency(med.price || med.total || 0, currency)}</p>
                        <p className="text-xs">COGS Breakdown: {formatCurrency(med.perShipmentCost, currency)} 
                          {med.shipping !== undefined && ` + Shipping: ${formatCurrency(med.shipping, currency)}`}
                          {med.dispensing !== undefined && ` + Dispensing: ${formatCurrency(med.dispensing, currency)}`}
                        </p>
                      </div>
                    )}
                  </div>
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
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Clear History
              </button>
            </div>
            <div className="space-y-2">
              {history.map((item) => (
                <div
                  key={item.id}
                  onClick={() => loadHistoryItem(item)}
                  className="p-4 border border-blue-200 dark:border-blue-700 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer"
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
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Clear All
              </button>
            </div>
            <div className="space-y-2">
              {templates.map((template) => (
                <div
                  key={template.id}
                  onClick={() => loadTemplate(template)}
                  className="p-4 border border-blue-200 dark:border-blue-700 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer"
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
              <p className="text-sm text-blue-600 dark:text-blue-400">Total Refunds Calculated</p>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{formatCurrency(stats.totalRefunds, currency)}</p>
            </div>
            <div>
              <p className="text-sm text-blue-600 dark:text-blue-400">Average Refund Amount</p>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{formatCurrency(stats.averageRefund, currency)}</p>
            </div>
            <div>
              <p className="text-sm text-blue-600 dark:text-blue-400">Total Calculations</p>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{stats.totalCalculations}</p>
            </div>
            <div>
              <p className="text-sm text-blue-600 dark:text-blue-400">Most Used Medication</p>
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

        {/* Instructions Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4 text-blue-600 dark:text-blue-400">📖 How to Use the Refund Calculator</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3 text-blue-700 dark:text-blue-300">Basic Calculation Steps</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li className="mb-2">
                  <strong>Enter the Amount Paid:</strong> Enter the total amount you paid (e.g., 100.00). This is the total cost of the medication or service.
                </li>
                <li className="mb-2">
                  <strong>Enter Medication/Service Dispensed:</strong> Enter the amount of medication or service you received. You can include units (e.g., "100mg", "50ml") or just the number (e.g., "100"). The calculator will automatically detect the amount.
                </li>
                <li className="mb-2">
                  <strong>Enter Weeks Paid:</strong> Enter the number of weeks you paid for. You can use formats like "12", "12 weeks", or "12w".
                </li>
                <li className="mb-2">
                  <strong>Enter Weeks Received:</strong> Enter the number of weeks of medication/service you actually received. If you received the full amount, enter the same as "Weeks Paid".
                </li>
                <li className="mb-2">
                  <strong>Click Calculate:</strong> Click the "Calculate" button to see your results, including the refund amount, cost per week, and detailed breakdown.
                </li>
              </ol>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3 text-blue-700 dark:text-blue-300">Using the Medication List</h3>
              <ul className="list-disc list-inside space-y-2 text-sm">
                <li>Click <strong>"➕ Add Medication"</strong> to select from the list of available medications</li>
                <li>After selecting a medication, you'll see the pre-filled details</li>
                <li>Adjust the "Weeks Received" field for each medication to calculate refunds</li>
                <li>You can add multiple medications and see a total refund amount</li>
                <li>Use the search box to filter medications by name, category, or pharmacy</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3 text-blue-700 dark:text-blue-300">Understanding the Results</h3>
              <ul className="list-disc list-inside space-y-2 text-sm">
                <li><strong>Cost per Week:</strong> The amount you paid divided by the number of weeks</li>
                <li><strong>Cost per Unit:</strong> The amount you paid divided by the medication amount</li>
                <li><strong>Medication per Week:</strong> How much medication you receive each week</li>
                <li><strong>Weekly Cost per Unit:</strong> The cost per unit per week</li>
                <li><strong>Refund Amount:</strong> The amount you should receive back if you didn't receive the full medication supply</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3 text-blue-700 dark:text-blue-300">Additional Features</h3>
              <ul className="list-disc list-inside space-y-2 text-sm">
                <li><strong>History:</strong> Your recent calculations are automatically saved. Click on any history item to reload it.</li>
                <li><strong>Templates:</strong> Save frequently used calculations as templates for quick access later.</li>
                <li><strong>Statistics:</strong> View your total refunds calculated, average refund amount, and calculation count.</li>
                <li><strong>Currency:</strong> Select your preferred currency from the dropdown at the bottom.</li>
                <li><strong>Dark Mode:</strong> Toggle dark mode using the moon icon in the header.</li>
              </ul>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-2 text-blue-700 dark:text-blue-300">Refund Formula</h3>
              <p className="text-sm mb-2">
                <strong>Refund = (Weeks Paid - Weeks Received) × Cost per Week</strong>
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                <em>Note: If weeks received is equal to or greater than weeks paid, the refund will be $0.00 (full medication received).</em>
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-2 text-blue-700 dark:text-blue-300">Example Calculation</h3>
              <p className="text-sm mb-2">
                If you paid <strong>$240</strong> for <strong>12 weeks</strong> but only received <strong>8 weeks</strong>:
              </p>
              <ul className="text-sm space-y-1 list-disc list-inside">
                <li>Cost per Week = $240 ÷ 12 = $20/week</li>
                <li>Weeks Not Received = 12 - 8 = 4 weeks</li>
                <li>Refund = 4 × $20 = <strong>$80</strong></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Currency Selector */}
        <div className="mt-6 flex justify-end">
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="px-4 py-2 border border-blue-300 dark:border-blue-600 rounded dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
