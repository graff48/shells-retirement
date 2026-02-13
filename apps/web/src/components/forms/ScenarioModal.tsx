'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { trpc } from '@/lib/trpc';

const scenarioSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  retirementAge: z.number().min(45).max(80),
  targetCity: z.string().optional(),
  targetState: z.string().optional(),
  essentialSpending: z.number().min(0),
  discretionarySpending: z.number().min(0),
  withdrawalStrategy: z.enum(['four_percent', 'guardrails', 'buckets', 'tax_efficient', 'variable_percentage']),
  socialSecurityStrategy: z.enum(['early', 'full', 'delayed']),
  expectedReturn: z.number().min(0).max(20),
  inflationRate: z.number().min(0).max(20),
});

type ScenarioFormData = z.infer<typeof scenarioSchema>;

interface ScenarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ScenarioModal({ isOpen, onClose, onSuccess }: ScenarioModalProps) {
  const [error, setError] = useState<string | null>(null);
  const utils = trpc.useContext();

  const createScenario = trpc.scenario.create.useMutation({
    onSuccess: () => {
      utils.scenario.list.invalidate();
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
    formState: { errors, isSubmitting },
  } = useForm<ScenarioFormData>({
    resolver: zodResolver(scenarioSchema),
    defaultValues: {
      retirementAge: 65,
      essentialSpending: 45000,
      discretionarySpending: 20000,
      withdrawalStrategy: 'four_percent',
      socialSecurityStrategy: 'full',
      expectedReturn: 7.0,
      inflationRate: 3.0,
    },
  });

  const onSubmit = (data: ScenarioFormData) => {
    setError(null);
    createScenario.mutate(data);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Create Scenario</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">&times;</button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Scenario Name</label>
            <input
              {...register('name')}
              className="w-full px-3 py-2 border rounded"
              placeholder="Base Plan"
            />
            {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description (optional)</label>
            <textarea
              {...register('description')}
              className="w-full px-3 py-2 border rounded"
              rows={2}
              placeholder="My primary retirement plan"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Retirement Age</label>
              <input
                type="number"
                {...register('retirementAge', { valueAsNumber: true })}
                className="w-full px-3 py-2 border rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Location (City)</label>
              <input
                {...register('targetCity')}
                className="w-full px-3 py-2 border rounded"
                placeholder="San Francisco"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Essential Spending ($/year)</label>
              <input
                type="number"
                {...register('essentialSpending', { valueAsNumber: true })}
                className="w-full px-3 py-2 border rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Discretionary Spending ($/year)</label>
              <input
                type="number"
                {...register('discretionarySpending', { valueAsNumber: true })}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Withdrawal Strategy</label>
              <select {...register('withdrawalStrategy')} className="w-full px-3 py-2 border rounded">
                <option value="four_percent">4% Rule</option>
                <option value="guardrails">Guardrails Method</option>
                <option value="buckets">Bucket Strategy</option>
                <option value="tax_efficient">Tax-Efficient Sequencing</option>
                <option value="variable_percentage">Variable Percentage</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Social Security Strategy</label>
              <select {...register('socialSecurityStrategy')} className="w-full px-3 py-2 border rounded">
                <option value="early">Early (62)</option>
                <option value="full">Full Retirement Age</option>
                <option value="delayed">Delayed (70)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Expected Return (%)</label>
              <input
                type="number"
                step="0.1"
                {...register('expectedReturn', { valueAsNumber: true })}
                className="w-full px-3 py-2 border rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Inflation Rate (%)</label>
              <input
                type="number"
                step="0.1"
                {...register('inflationRate', { valueAsNumber: true })}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
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
              {isSubmitting ? 'Creating...' : 'Create Scenario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
