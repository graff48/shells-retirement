'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { trpc } from '@/lib/trpc';

const expenseSchema = z.object({
  category: z.enum(['housing', 'healthcare', 'food', 'transportation', 'utilities', 'insurance', 'debt', 'dining_out', 'travel', 'entertainment', 'hobbies', 'shopping', 'gifts_charity', 'flex']),
  amount: z.number().min(0, 'Amount must be positive'),
  type: z.enum(['essential', 'discretionary']),
  inflationRate: z.number().default(3.0),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ExpenseModal({ isOpen, onClose, onSuccess }: ExpenseModalProps) {
  const utils = trpc.useContext();

  const createExpense = trpc.expense.create.useMutation({
    onSuccess: () => {
      utils.expense.list.invalidate();
      onSuccess();
      onClose();
    },
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      inflationRate: 3.0,
      type: 'essential',
    },
  });

  const onSubmit = (data: ExpenseFormData) => {
    createExpense.mutate({
      ...data,
      startAge: 0,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Add Expense</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">&times;</button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select {...register('category')} className="w-full px-3 py-2 border rounded">
              <optgroup label="Essential">
                <option value="housing">Housing</option>
                <option value="healthcare">Healthcare</option>
                <option value="food">Food</option>
                <option value="transportation">Transportation</option>
                <option value="utilities">Utilities</option>
                <option value="insurance">Insurance</option>
                <option value="debt">Debt Payments</option>
              </optgroup>
              <optgroup label="Discretionary">
                <option value="dining_out">Dining Out</option>
                <option value="travel">Travel</option>
                <option value="entertainment">Entertainment</option>
                <option value="hobbies">Hobbies</option>
                <option value="shopping">Shopping</option>
                <option value="gifts_charity">Gifts/Charity</option>
                <option value="flex">Flex Fund</option>
              </optgroup>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Monthly Amount</label>
            <input
              type="number"
              {...register('amount', { valueAsNumber: true })}
              className="w-full px-3 py-2 border rounded"
              placeholder="500"
            />
            {errors.amount && <p className="text-red-500 text-sm">{errors.amount.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  {...register('type')}
                  value="essential"
                  className="mr-2"
                />
                Essential
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  {...register('type')}
                  value="discretionary"
                  className="mr-2"
                />
                Discretionary
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Inflation Rate (%)</label>
            <input
              type="number"
              step="0.1"
              {...register('inflationRate', { valueAsNumber: true })}
              className="w-full px-3 py-2 border rounded"
              placeholder="3.0"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Add Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
