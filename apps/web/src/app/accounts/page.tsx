'use client';

import { useState } from 'react';
import Link from 'next/link';
import { trpc } from '@/lib/trpc';
import { AccountModal } from '@/components/forms/AccountModal';

export default function AccountsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: accounts, isLoading } = trpc.account.list.useQuery();
  const deleteAccount = trpc.account.delete.useMutation({
    onSuccess: () => {
      utils.account.list.invalidate();
    },
  });

  const utils = trpc.useContext();

  const totalBalance = accounts?.reduce((sum: number, acc: { currentBalance: number }) => sum + Number(acc.currentBalance), 0) || 0;
  const totalMonthly = accounts?.reduce((sum: number, acc: { monthlyContribution: number }) => sum + Number(acc.monthlyContribution), 0) || 0;

  if (isLoading) {
    return (
      <main className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <p>Loading accounts...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <Link href="/" className="text-blue-600 hover:underline">&larr; Back to Home</Link>
            <h1 className="text-3xl font-bold mt-4">Retirement Accounts</h1>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            + Add Account
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Your Nest Egg Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SummaryCard
              title="Total Balance"
              value={`$${totalBalance.toLocaleString()}`}
            />
            <SummaryCard
              title="Monthly Contribution"
              value={`$${totalMonthly.toLocaleString()}`}
            />
            <SummaryCard
              title="Number of Accounts"
              value={accounts?.length.toString() || '0'}
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {accounts && accounts.length > 0 ? (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Account</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Type</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Balance</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Monthly</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Allocation</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {accounts.map((account: any) => (
                  <tr key={account.id}>
                    <td className="px-6 py-4">{account.name}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs ${
                        account.taxTreatment === 'pre_tax' ? 'bg-blue-100 text-blue-800' :
                        account.taxTreatment === 'post_tax' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {account.taxTreatment.replace('_', '-')}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium">${Number(account.currentBalance).toLocaleString()}</td>
                    <td className="px-6 py-4">${Number(account.monthlyContribution).toLocaleString()}</td>
                    <td className="px-6 py-4">{account.stockAllocation}/{account.bondAllocation}/{account.cashAllocation}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => {
                          if (confirm('Delete this account?')) {
                            deleteAccount.mutate({ id: account.id });
                          }
                        }}
                        className="text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <p>No accounts yet. Add your first retirement account to get started.</p>
            </div>
          )}
        </div>

        <div className="mt-8 flex justify-center">
          <Link
            href="/expenses"
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Next: Expenses &rarr;
          </Link>
        </div>
      </div>

      <AccountModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {}}
      />
    </main>
  );
}

function SummaryCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <p className="text-sm text-gray-600">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
