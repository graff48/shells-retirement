'use client';

import { useState } from 'react';
import Link from 'next/link';
import { trpc } from '@/lib/trpc';
import { ExpenseModal } from '@/components/forms/ExpenseModal';

export default function ExpensesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: expenses, isLoading } = trpc.expense.list.useQuery();
  const utils = trpc.useContext();

  const deleteExpense = trpc.expense.delete.useMutation({
    onSuccess: () => {
      utils.expense.list.invalidate();
    },
  });

  const essentialExpenses = expenses?.filter((e: any) => e.type === 'essential') || [];
  const discretionaryExpenses = expenses?.filter((e: any) => e.type === 'discretionary') || [];

  const essentialTotal = essentialExpenses.reduce((sum: number, e: any) => sum + Number(e.amount), 0);
  const discretionaryTotal = discretionaryExpenses.reduce((sum: number, e: any) => sum + Number(e.amount), 0);
  const total = essentialTotal + discretionaryTotal;

  if (isLoading) {
    return (
      <main className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <p>Loading expenses...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <Link href="/accounts" className="text-blue-600 hover:underline">&larr; Back to Accounts</Link>
            <h1 className="text-3xl font-bold mt-4">Retirement Expenses</h1>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            + Add Expense
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <ExpenseCategory
            title="Essential Expenses"
            total={`$${essentialTotal.toLocaleString()}`}
            items={essentialExpenses}
            onDelete={(id) => {
              if (confirm('Delete this expense?')) {
                deleteExpense.mutate({ id });
              }
            }}
          />

          <ExpenseCategory
            title="Discretionary Expenses"
            total={`$${discretionaryTotal.toLocaleString()}`}
            items={discretionaryExpenses}
            onDelete={(id) => {
              if (confirm('Delete this expense?')) {
                deleteExpense.mutate({ id });
              }
            }}
          />
        </div>

        <div className="bg-blue-50 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-2">Monthly Budget Summary</h2>
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div>
              <p className="text-sm text-gray-600">Essential</p>
              <p className="text-xl font-bold">${essentialTotal.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Discretionary</p>
              <p className="text-xl font-bold">${discretionaryTotal.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-xl font-bold text-blue-600">${total.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="flex justify-between">
          <Link
            href="/accounts"
            className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
          >
            &larr; Back to Accounts
          </Link>
          <Link
            href="/scenarios"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Next: Scenarios &rarr;
          </Link>
        </div>
      </div>

      <ExpenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {}}
      />
    </main>
  );
}

function ExpenseCategory({
  title,
  total,
  items,
  onDelete,
}: {
  title: string;
  total: string;
  items: { id: string; category: string; amount: number; type: string }[];
  onDelete: (id: string) => void;
}) {
  const formatCategory = (cat: string) => cat.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        <span className="text-xl font-bold">{total}</span>
      </div>

      {items.length > 0 ? (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-700">{formatCategory(item.category)}</span>
              <div className="flex items-center gap-3">
                <span className="font-medium">${Number(item.amount).toLocaleString()}</span>
                <button
                  onClick={() => onDelete(item.id)}
                  className="text-red-600 hover:underline text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-4">No expenses added yet</p>
      )}
    </div>
  );
}
