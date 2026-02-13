'use client';

import { useState } from 'react';
import Link from 'next/link';
import { trpc } from '@/lib/trpc';
import { ScenarioModal } from '@/components/forms/ScenarioModal';
import { LifestyleCard } from '@/components/ai/LifestyleCard';

export default function ScenariosPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [calculatingId, setCalculatingId] = useState<string | null>(null);

  const { data: scenarios, isLoading } = trpc.scenario.list.useQuery();
  const { data: accounts } = trpc.account.list.useQuery();
  const { data: user } = trpc.user.getById.useQuery();
  const utils = trpc.useContext();

  const deleteScenario = trpc.scenario.delete.useMutation({
    onSuccess: () => {
      utils.scenario.list.invalidate();
    },
  });

  const runCalculation = trpc.calculation.runFullScenario.useMutation({
    onSuccess: () => {
      utils.scenario.list.invalidate();
      setCalculatingId(null);
    },
    onError: () => {
      setCalculatingId(null);
    },
  });

  const generateRecommendations = trpc.ai.generateRecommendations.useMutation({
    onSuccess: () => {
      utils.scenario.list.invalidate();
    },
  });

  const totalBalance = accounts?.reduce((sum: number, acc: { currentBalance: number }) => sum + Number(acc.currentBalance), 0) || 0;

  // Calculate current age from user's birth date
  let currentAge: number | null = null;
  if (user?.birthDate) {
    const now = new Date();
    const birth = new Date(user.birthDate);
    currentAge = now.getFullYear() - birth.getFullYear() -
      (now < new Date(now.getFullYear(), birth.getMonth(), birth.getDate()) ? 1 : 0);
  }

  const selectedScenarioData = scenarios?.find((s: any) => s.id === selectedScenario);

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
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <Link href="/expenses" className="text-blue-600 hover:underline">&larr; Back to Expenses</Link>
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
            <StatCard label="Current Age" value={currentAge !== null ? currentAge.toString() : 'Set birth date'} />
            <StatCard label="Total Savings" value={`$${totalBalance.toLocaleString()}`} />
            <StatCard label="Scenarios" value={scenarios?.length.toString() || '0'} />
            <StatCard
              label="Best Success Rate"
              value={`${Math.round(scenarios?.reduce((max: number, s: any) => Math.max(max, s.results?.[0]?.successProbability || 0), 0) || 0)}%`}
              highlight
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
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
                    {scenarios.map((scenario: any) => {
                      const result = scenario.results?.[0];
                      const successRate = result?.successProbability || 0;
                      const annualSpending = Number(scenario.essentialSpending) + Number(scenario.discretionarySpending);
                      const isSelected = selectedScenario === scenario.id;

                      return (
                        <tr
                          key={scenario.id}
                          className={isSelected ? 'bg-blue-50' : ''}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <button
                                onClick={() => setSelectedScenario(scenario.id)}
                                className="text-left hover:text-blue-600"
                              >
                                {scenario.name}
                              </button>
                              {scenario.isDefault && (
                                <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded">Default</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">{scenario.retirementAge}</td>
                          <td className="px-6 py-4">${annualSpending.toLocaleString()}</td>
                          <td className="px-6 py-4">
                            {result ? (
                              <span className={`font-bold ${
                                successRate >= 80 ? 'text-green-600' :
                                successRate >= 60 ? 'text-yellow-600' : 'text-red-600'
                              }`}>
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

            {selectedScenarioData && selectedScenarioData.results?.[0] && (
              <div className="mt-6 bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Recommendations</h3>
                  <button
                    onClick={() => generateRecommendations.mutate({ scenarioId: selectedScenarioData.id })}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Refresh
                  </button>
                </div>

                {selectedScenarioData.recommendations && selectedScenarioData.recommendations.length > 0 ? (
                  <div className="space-y-3">
                    {selectedScenarioData.recommendations.map((rec: any) => (
                      <div key={rec.id} className="p-3 bg-gray-50 rounded border-l-4 border-blue-500">
                        <div className="flex justify-between">
                          <h4 className="font-medium">{rec.title}</h4>
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            rec.impact === 'high' ? 'bg-red-100 text-red-700' :
                            rec.impact === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {rec.impact} impact
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <button
                    onClick={() => generateRecommendations.mutate({ scenarioId: selectedScenarioData.id })}
                    className="text-blue-600 hover:underline"
                  >
                    Generate recommendations for this scenario
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
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
          </div>
        </div>

        <div className="mt-8 flex justify-between">
          <Link
            href="/expenses"
            className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
          >
            &larr; Back to Expenses
          </Link>
          <Link
            href="/"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Home &rarr;
          </Link>
        </div>
      </div>

      <ScenarioModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {}}
      />
    </main>
  );

  function handleRunCalculation(scenarioId: string) {
    setCalculatingId(scenarioId);
    runCalculation.mutate({ scenarioId });
  }
}

function StatCard({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="bg-white rounded-lg p-4">
      <p className="text-sm text-gray-600">{label}</p>
      <p className={`text-2xl font-bold ${highlight ? 'text-green-600' : ''}`}>{value}</p>
    </div>
  );
}
