'use client';

import { useState } from 'react';
import Link from 'next/link';
import { trpc } from '@/lib/trpc';
import { ScenarioModal } from '@/components/forms/ScenarioModal';

export default function ScenariosPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  const totalBalance = accounts?.reduce((sum, acc) => sum + Number(acc.currentBalance), 0) || 0;
  const currentAge = 45; // TODO: Get from user

  if (isLoading) {
    return (
      <main className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <p>Loading scenarios...</p>
        </div>
      </main>
    );
  }

  const handleRunCalculation = async (scenarioId: string) => {
    setCalculatingId(scenarioId);
    runCalculation.mutate({ scenarioId, userId });
  };

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <Link href="/expenses" className="text-blue-600 hover:underline">← Back to Expenses</Link>
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
              value={`${Math.round(scenarios?.reduce((max, s) => Math.max(max, s.results?.[0]?.successProbability || 0), 0) || 0)}%`}
              highlight 
            />
          </div>
        </div>

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
                  const annualSpending = Number(scenario.essentialSpending) + Number(scenario.discretionarySpending);
                  
                  return (
                    <tr key={scenario.id}>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {scenario.name}
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
                        <button 
                          onClick={() => handleRunCalculation(scenario.id)}
                          disabled={calculatingId === scenario.id}
                          className="text-blue-600 hover:underline mr-3 disabled:opacity-50"
                        >
                          {calculatingId === scenario.id ? 'Calculating...' : 'Run Calc'}
                        </button>
                        <button 
                          onClick={() => {
                            if (confirm('Delete this scenario?')) {
                              deleteScenario.mutate({ id: scenario.id });
                            }
                          }}
                          className="text-red-600 hover:underline"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <p>No scenarios yet. Create your first retirement scenario to get started.</p>
            </div>
          )}
        </div>

        <div className="mt-8 flex justify-between">
          <Link 
            href="/expenses"
            className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
          >
            ← Back to Expenses
          </Link>
          <Link 
            href="/"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
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
}

function StatCard({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="bg-white rounded-lg p-4">
      <p className="text-sm text-gray-600">{label}</p>
      <p className={`text-2xl font-bold ${highlight ? 'text-green-600' : ''}`}>{value}</p>
    </div>
  );
}
