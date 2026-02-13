'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { trpc } from '@/lib/trpc';

const accountSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['_401k', '_403b', '_457', 'traditional_ira', 'roth_ira', 'sep_ira', 'simple_ira', 'hsa', 'taxable', 'annuity', 'pension', 'cash_savings']),
  currentBalance: z.number().min(0, 'Balance must be positive'),
  monthlyContribution: z.number().min(0),
  employerMatchPercent: z.number().min(0).max(100),
  employerMatchMax: z.number().min(0).max(100),
  taxTreatment: z.enum(['pre_tax', 'post_tax', 'taxable']),
  stockAllocation: z.number().min(0).max(100),
  bondAllocation: z.number().min(0).max(100),
  cashAllocation: z.number().min(0).max(100),
});

type AccountFormData = z.infer<typeof accountSchema>;

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AccountModal({ isOpen, onClose, onSuccess }: AccountModalProps) {
  const [error, setError] = useState<string | null>(null);
  const utils = trpc.useContext();

  const createAccount = trpc.account.create.useMutation({
    onSuccess: () => {
      utils.account.list.invalidate();
      onSuccess();
      onClose();
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      monthlyContribution: 0,
      employerMatchPercent: 0,
      employerMatchMax: 0,
      taxTreatment: 'pre_tax',
      stockAllocation: 70,
      bondAllocation: 25,
      cashAllocation: 5,
    },
  });

  const allocations = watch(['stockAllocation', 'bondAllocation', 'cashAllocation']);
  const totalAllocation = allocations.reduce((a, b) => (a || 0) + (b || 0), 0);

  const onSubmit = (data: AccountFormData) => {
    if (totalAllocation !== 100) {
      setError('Asset allocations must sum to 100%');
      return;
    }
    setError(null);
    createAccount.mutate(data);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Add Account</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">&times;</button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Account Name</label>
              <input
                {...register('name')}
                className="w-full px-3 py-2 border rounded"
                placeholder="My 401k"
              />
              {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Account Type</label>
              <select {...register('type')} className="w-full px-3 py-2 border rounded">
                <option value="_401k">401k</option>
                <option value="_403b">403b</option>
                <option value="traditional_ira">Traditional IRA</option>
                <option value="roth_ira">Roth IRA</option>
                <option value="hsa">HSA</option>
                <option value="taxable">Taxable</option>
                <option value="pension">Pension</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Current Balance</label>
            <input
              type="number"
              {...register('currentBalance', { valueAsNumber: true })}
              className="w-full px-3 py-2 border rounded"
              placeholder="500000"
            />
            {errors.currentBalance && <p className="text-red-500 text-sm">{errors.currentBalance.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Monthly Contribution</label>
              <input
                type="number"
                {...register('monthlyContribution', { valueAsNumber: true })}
                className="w-full px-3 py-2 border rounded"
                placeholder="1500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Tax Treatment</label>
              <select {...register('taxTreatment')} className="w-full px-3 py-2 border rounded">
                <option value="pre_tax">Pre-tax</option>
                <option value="post_tax">Post-tax (Roth)</option>
                <option value="taxable">Taxable</option>
              </select>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">Asset Allocation</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm mb-1">Stocks %</label>
                <input
                  type="number"
                  {...register('stockAllocation', { valueAsNumber: true })}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Bonds %</label>
                <input
                  type="number"
                  {...register('bondAllocation', { valueAsNumber: true })}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Cash %</label>
                <input
                  type="number"
                  {...register('cashAllocation', { valueAsNumber: true })}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
            </div>
            <p className={`text-sm mt-2 ${totalAllocation === 100 ? 'text-green-600' : 'text-red-600'}`}>
              Total: {totalAllocation}% {totalAllocation !== 100 && '(must equal 100%)'}
            </p>
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
              {isSubmitting ? 'Saving...' : 'Add Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
