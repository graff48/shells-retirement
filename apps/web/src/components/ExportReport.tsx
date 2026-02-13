'use client';

import { useRef, useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { Scenario, Account } from '@retirement-advisor/types';

interface ExportReportProps {
  scenario: Scenario | null;
  accounts: Account[];
  currentAge?: number;
}

export function ExportReport({ scenario, accounts, currentAge = 45 }: ExportReportProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const handleExportPDF = async () => {
    if (!scenario || !reportRef.current) return;

    setIsGenerating(true);

    try {
      const element = reportRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);

      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      let imgY = 10;

      pdf.setFontSize(20);
      pdf.text(`Retirement Scenario Report: ${scenario.name}`, 20, 20);
      pdf.setFontSize(12);
      pdf.text(`Generated on ${new Date().toLocaleDateString()}`, 20, 28);

      imgY = 35;
      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);

      // Add additional pages if content overflows
      const scaledHeight = imgHeight * ratio;
      const pageHeight = pdfHeight - 40;

      if (scaledHeight > pageHeight) {
        let heightLeft = scaledHeight - pageHeight;
        let position = -pageHeight;

        while (heightLeft >= 0) {
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', imgX, position, imgWidth * ratio, imgHeight * ratio);
          heightLeft -= pageHeight;
          position -= pageHeight;
        }
      }

      pdf.save(`retirement-scenario-${scenario.name.toLowerCase().replace(/\s+/g, '-')}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString()}`;
  };

  if (!scenario) {
    return null;
  }

  const totalBalance = accounts?.reduce((sum, acc) => sum + Number(acc.currentBalance), 0) || 0;
  const result = scenario.results?.[0];
  const annualSpending = Number(scenario.essentialSpending) + Number(scenario.discretionarySpending);
  const successRate = result?.successProbability || 0;

  return (
    <div className="space-y-4">
      <button
        onClick={handleExportPDF}
        disabled={isGenerating}
        className="w-full px-4 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
      >
        {isGenerating ? (
          <>
            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Generating PDF...
          </>
        ) : (
          <>
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Download Report (PDF)
          </>
        )}
      </button>

      {/* Hidden report content for PDF generation */}
      <div
        ref={reportRef}
        className="absolute left-[-9999px] w-[800px] bg-white p-8"
        style={{ position: 'absolute', left: '-9999px' }}
      >
        <div className="space-y-6">
          {/* Scenario Summary */}
          <div className="border-b pb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Scenario Summary</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-600">Scenario Name</p>
                <p className="font-semibold">{scenario.name}</p>
              </div>
              <div>
                <p className="text-gray-600">Retirement Age</p>
                <p className="font-semibold">{scenario.retirementAge}</p>
              </div>
              <div>
                <p className="text-gray-600">Current Age</p>
                <p className="font-semibold">{currentAge}</p>
              </div>
              <div>
                <p className="text-gray-600">Years to Retirement</p>
                <p className="font-semibold">{scenario.retirementAge - currentAge}</p>
              </div>
            </div>
          </div>

          {/* Financial Overview */}
          <div className="border-b pb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Financial Overview</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded">
                <p className="text-blue-600 text-sm">Total Savings</p>
                <p className="text-2xl font-bold text-blue-900">{formatCurrency(totalBalance)}</p>
              </div>
              <div className="bg-green-50 p-4 rounded">
                <p className="text-green-600 text-sm">Annual Spending</p>
                <p className="text-2xl font-bold text-green-900">{formatCurrency(annualSpending)}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded">
                <p className="text-purple-600 text-sm">Essential Spending</p>
                <p className="text-2xl font-bold text-purple-900">{formatCurrency(Number(scenario.essentialSpending))}</p>
              </div>
              <div className="bg-orange-50 p-4 rounded">
                <p className="text-orange-600 text-sm">Discretionary Spending</p>
                <p className="text-2xl font-bold text-orange-900">{formatCurrency(Number(scenario.discretionarySpending))}</p>
              </div>
            </div>
          </div>

          {/* Monte Carlo Results */}
          {result && (
            <div className="border-b pb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Monte Carlo Simulation Results</h3>
              <div className="grid grid-cols-3 gap-4">
                <div
                  className={`p-4 rounded ${
                    successRate >= 80
                      ? 'bg-green-50'
                      : successRate >= 60
                      ? 'bg-yellow-50'
                      : 'bg-red-50'
                  }`}
                >
                  <p className="text-gray-600 text-sm">Success Probability</p>
                  <p
                    className={`text-3xl font-bold ${
                      successRate >= 80
                        ? 'text-green-600'
                        : successRate >= 60
                        ? 'text-yellow-600'
                        : 'text-red-600'
                    }`}
                  >
                    {Math.round(successRate)}%
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded">
                  <p className="text-gray-600 text-sm">Median Ending Balance</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(result.medianEndingBalance)}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded">
                  <p className="text-gray-600 text-sm">Worst Case Balance</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(result.worstCaseBalance)}</p>
                </div>
              </div>
              {result.yearOfFirstShortfall && (
                <div className="mt-4 p-4 bg-red-50 rounded">
                  <p className="text-red-600">
                    <strong>Warning:</strong> Potential shortfall detected at age {result.yearOfFirstShortfall}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Strategy Details */}
          <div className="border-b pb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Strategy Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-600">Withdrawal Strategy</p>
                <p className="font-semibold capitalize">{scenario.withdrawalStrategy.replace(/_/g, ' ')}</p>
              </div>
              <div>
                <p className="text-gray-600">Social Security Strategy</p>
                <p className="font-semibold capitalize">{scenario.socialSecurityStrategy}</p>
              </div>
              <div>
                <p className="text-gray-600">Expected Return</p>
                <p className="font-semibold">{scenario.expectedReturn}%</p>
              </div>
              <div>
                <p className="text-gray-600">Inflation Rate</p>
                <p className="font-semibold">{scenario.inflationRate}%</p>
              </div>
            </div>
          </div>

          {/* Accounts Summary */}
          {accounts && accounts.length > 0 && (
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Accounts</h3>
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 text-gray-600">Account</th>
                    <th className="text-left py-2 text-gray-600">Type</th>
                    <th className="text-right py-2 text-gray-600">Balance</th>
                    <th className="text-right py-2 text-gray-600">Allocation</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((account) => (
                    <tr key={account.id} className="border-b">
                      <td className="py-3 font-medium">{account.name}</td>
                      <td className="py-3 text-gray-600 capitalize">{account.type.replace(/_/g, ' ')}</td>
                      <td className="py-3 text-right">{formatCurrency(Number(account.currentBalance))}</td>
                      <td className="py-3 text-right text-sm text-gray-600">
                        {account.stockAllocation}%/{account.bondAllocation}%/{account.cashAllocation}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Recommendations */}
          {scenario.recommendations && scenario.recommendations.length > 0 && (
            <div className="pt-4">
              <h3 className="text-xl font-bold text-gray-900 mb-4">AI Recommendations</h3>
              <div className="space-y-3">
                {scenario.recommendations.map((rec) => (
                  <div key={rec.id} className="p-4 bg-gray-50 rounded border-l-4 border-blue-500">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold">{rec.title}</h4>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          rec.impact === 'high'
                            ? 'bg-red-100 text-red-700'
                            : rec.impact === 'medium'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {rec.impact} impact
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm">{rec.description}</p>
                    {rec.estimatedImprovement > 0 && (
                      <p className="text-green-600 text-sm mt-2">
                        Estimated improvement: {rec.estimatedImprovement}%
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="pt-8 border-t text-center text-gray-500 text-sm">
            <p>Generated by Retirement Advisor</p>
            <p>This report is for informational purposes only and does not constitute financial advice.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
