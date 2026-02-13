'use client';

import { useState } from 'react';
import Link from 'next/link';
import { trpc } from '@/lib/trpc';
import { ScenarioModal } from '@/components/forms/ScenarioModal';
import { LifestyleCard } from '@/components/ai/LifestyleCard';
import {
  PortfolioProjectionChart,
  ExpenseBreakdownChart,
  AssetAllocationChart,
} from '@/components/charts';
import { ExportReport } from '@/components/ExportReport';

export default function ScenariosPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [calculatingId, setCalculatingId] = useState<string | null>(null);
  const userId = 'test-user-id';

  const { data: scenarios, isLoading } = trpc.scenario.list.useQuery({ userId });
  const { data: accounts } = trpc.account.list.useQuery({ userId });
  const utils = trpc.useContext();

  const deleteScenario = trpc.scenario.delete.useMutation({
    onSuccess: () => {
      utils.scenario.list.invalidate({ userId });
    },
  });

  const runCalculation = trpc.calculation.runFullScenario.useMutation({
    onSuccess: () => {
      utils.scenario.list.invalidate({ userId });
      setCalculatingId(null);
    },
    onError: () => {
      setCalculatingId(null);
    },
  });

  const generateRecommendations = trpc.ai.generateRecommendations.useMutation({
    onSuccess: () => {
      utils.scenario.list.invalidate({ userId });
    },
  });

  const totalBalance = accounts?.reduce((sum, acc) => sum + Number(acc.currentBalance), 0) || 0;
  const currentAge = 45;

  const selectedScenarioData = scenarios?.find((s) => s.id === selectedScenario);

  if (isLoading) {
    return (
      <main className="min-h-screen p-8">
        <div className="max-w-6xl mx-auto">
          <p>Loading scenarios...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <Link href="/expenses" className="text-blue-600 hover:underline">
              ← Back to Expenses
            </Link>
            <h1 className="text-3xl font-bold mt-4">Retirement Scenarios</h1>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            + New Scenario
          </button>
        </div>

        <div className="bg-blue-50 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Quick Stats</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard label="Current Age" value={currentAge.toString()} />
            <StatCard label="Total Savings" value={`$${totalBalance.toLocaleString()}`} />
            <StatCard label="Scenarios" value={scenarios?.length.toString() || '0'} />
            <StatCard
              label="Best Success Rate"
              value={`${Math.round(
                scenarios?.reduce(
                  (max, s) => Math.max(max, s.results?.[0]?.successProbability || 0),
                  0
                ) || 0
              )}%`}
              highlight
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Scenarios Table */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              {scenarios && scenarios.length > 0 ? (
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Scenario</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Retire At</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Annual Spending</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Success Rate</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {scenarios.map((scenario) => {
                      const result = scenario.results?.[0];
                      const successRate = result?.successProbability || 0;
                      const annualSpending =
                        Number(scenario.essentialSpending) + Number(scenario.discretionarySpending);
                      const isSelected = selectedScenario === scenario.id;

                      return (
                        <tr key={scenario.id} className={isSelected ? 'bg-blue-50' : ''}>
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <button
                                onClick={() => setSelectedScenario(scenario.id)}
                                className="text-left hover:text-blue-600 font-medium"
                              >
                                {scenario.name}
                              </button>
                              {scenario.isDefault && (
                                <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded">
                                  Default
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">{scenario.retirementAge}</td>
                          <td className="px-6 py-4">${annualSpending.toLocaleString()}</td>
                          <td className="px-6 py-4">
                            {result ? (
                              <span
                                className={`font-bold ${
                                  successRate >= 80
                                    ? 'text-green-600'
                                    : successRate >= 60
                                    ? 'text-yellow-600'
                                    : 'text-red-600'
                                }`}
                              >
                                {Math.round(successRate)}%
                              </span>
                            ) : (
                              <span className="text-gray-400">Not calculated</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleRunCalculation(scenario.id)}
                                disabled={calculatingId === scenario.id}
                                className="text-blue-600 hover:underline text-sm disabled:opacity-50"
                              >
                                {calculatingId === scenario.id ? '...' : 'Run'}
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm('Delete this scenario?')) {
                                    deleteScenario.mutate({ id: scenario.id });
                                  }
                                }}
                                className="text-red-600 hover:underline text-sm"
                              >
                                Del
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <p>No scenarios yet. Create your first retirement scenario.</p>
                </div>
              )}
            </div>

            {/* Charts Section */}
            {selectedScenarioData && (
              <>
                {/* Portfolio Projection Chart */}
                {selectedScenarioData.results?.[0]?.yearlyProjections && (
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <PortfolioProjectionChart
                      projections={selectedScenarioData.results[0].yearlyProjections}
                      retirementAge={selectedScenarioData.retirementAge}
                      currentAge={currentAge}
                    />
                  </div>
                )}

                {/* Expense Breakdown Chart */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <ExpenseBreakdownChart
                    essentialSpending={Number(selectedScenarioData.essentialSpending)}
                    discretionarySpending={Number(selectedScenarioData.discretionarySpending)}
                  />
                </div>

                {/* Asset Allocation Chart */}
                {accounts && accounts.length > 0 && (
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <AssetAllocationChart accounts={accounts} />
                  </div>
                )}
              </>
            )}

            {/* Recommendations */}
            {selectedScenarioData && selectedScenarioData.results?.[0] && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Recommendations</h3>
                  <button
                    onClick={() =>
                      generateRecommendations.mutate({ scenarioId: selectedScenarioData.id })
                    }
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Refresh
                  </button>
                </div>

                {selectedScenarioData.recommendations && selectedScenarioData.recommendations.length > 0 ? (
                  <div className="space-y-3">
                    {selectedScenarioData.recommendations.map((rec) => (
                      <div key={rec.id} className="p-3 bg-gray-50 rounded border-l-4 border-blue-500">
                        <div className="flex justify-between">
                          <h4 className="font-medium">{rec.title}</h4>
                          <span
                            className={`text-xs px-2 py-0.5 rounded ${
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
                        <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <button
                    onClick={() =>
                      generateRecommendations.mutate({ scenarioId: selectedScenarioData.id })
                    }
                    className="text-blue-600 hover:underline"
                  >
                    Generate recommendations for this scenario
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="lg:col-span-1 space-y-6">
            {/* Lifestyle Card */}
            {selectedScenarioData ? (
              <LifestyleCard
                scenarioId={selectedScenarioData.id}
                description={selectedScenarioData.lifestyleDescription}
              />
            ) : (
              <div className="bg-gray-100 rounded-lg p-6 text-center text-gray-500">
                <p>Select a scenario to view AI lifestyle description</p>
              </div>
            )}

            {/* Export Report */}
            {selectedScenarioData && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">Export Report</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Download a comprehensive PDF report of your retirement scenario including charts,
                  projections, and recommendations.
                </p>
                <ExportReport
                  scenario={selectedScenarioData}
                  accounts={accounts || []}
                  currentAge={currentAge}
                />
              </div>
            )}

            {/* Quick Summary Card for Selected Scenario */}
            {selectedScenarioData && (
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-6 border border-indigo-100">
                <h3 className="text-lg font-semibold text-indigo-900 mb-4">Scenario Summary</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-indigo-600">Retirement Age</p>
                    <p className="text-xl font-bold text-indigo-900">{selectedScenarioData.retirementAge}</p>
                  </div>
                  <div>
                    <p className="text-sm text-indigo-600">Annual Spending</p>
                    <p className="text-xl font-bold text-indigo-900">
                      $
                      {(
                        Number(selectedScenarioData.essentialSpending) +
                        Number(selectedScenarioData.discretionarySpending)
                      ).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-indigo-600">Withdrawal Strategy</p>
                    <p className="font-medium text-indigo-900 capitalize">
                      {selectedScenarioData.withdrawalStrategy.replace(/_/g, ' ')}
                    </p>
                  </div>
                  {selectedScenarioData.results?.[0] && (
                    <div>
                      <p className="text-sm text-indigo-600">Success Rate</p>
                      <p
                        className={`text-2xl font-bold ${
                          (selectedScenarioData.results[0].successProbability || 0) >= 80
                            ? 'text-green-600'
                            : (selectedScenarioData.results[0].successProbability || 0) >= 60
                            ? 'text-yellow-600'
                            : 'text-red-600'
                        }`}
                      >
                        {Math.round(selectedScenarioData.results[0].successProbability || 0)}%
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 flex justify-between">
          <Link
            href="/expenses"
            className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
          >
            ← Back to Expenses
          </Link>
          <Link href="/" className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Back to Home →
          </Link>
        </div>
      </div>

      <ScenarioModal
        userId={userId}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {}}
      />
    </main>
  );

  function handleRunCalculation(scenarioId: string) {
    setCalculatingId(scenarioId);
    runCalculation.mutate({ scenarioId, userId });
  }
}

function StatCard({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="bg-white rounded-lg p-4">
      <p className="text-sm text-gray-600">{label}</p>
      <p className={`text-2xl font-bold ${highlight ? 'text-green-600' : ''}`}>{value}</p>
    </div>
  );
}
