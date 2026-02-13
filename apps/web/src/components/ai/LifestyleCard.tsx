'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';

interface LifestyleCardProps {
  scenarioId: string;
  description?: string | null;
}

export function LifestyleCard({ scenarioId, description }: LifestyleCardProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [localDescription, setLocalDescription] = useState(description);
  const [source, setSource] = useState<'ai' | 'fallback' | null>(null);
  const utils = trpc.useContext();

  const generateLifestyle = trpc.ai.generateLifestyle.useMutation({
    onSuccess: (data) => {
      setLocalDescription(data.description);
      setSource(data.source as 'ai' | 'fallback');
      setIsGenerating(false);
      utils.scenario.list.invalidate();
    },
    onError: () => {
      setIsGenerating(false);
    },
  });

  const handleGenerate = () => {
    setIsGenerating(true);
    generateLifestyle.mutate({ scenarioId });
  };

  if (localDescription) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-100">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-semibold text-blue-900">Your Retirement Lifestyle</h3>
          {source && (
            <span className={`text-xs px-2 py-1 rounded ${
              source === 'ai' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
            }`}>
              {source === 'ai' ? 'AI Generated' : 'Template'}
            </span>
          )}
        </div>
        
        <div className="prose prose-blue max-w-none">
          {localDescription.split('\n\n').map((paragraph, idx) => (
            <p key={idx} className="text-gray-700 mb-4 leading-relaxed">
              {paragraph}
            </p>
          ))}
        </div>
        
        <div className="mt-4 flex gap-3">
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
          >
            {isGenerating ? 'Regenerating...' : 'Regenerate'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 rounded-lg p-6 text-center">
      <svg 
        className="w-12 h-12 text-gray-400 mx-auto mb-4" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={1.5} 
          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" 
        />
      </svg>
      
      <h3 className="text-lg font-medium text-gray-900 mb-2">AI Lifestyle Description</h3>
      
      <p className="text-gray-600 mb-4">
        Generate a personalized narrative about what your retirement could look like based on your financial plan.
      </p>
      
      <button
        onClick={handleGenerate}
        disabled={isGenerating}
        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {isGenerating ? (
          <span className="flex items-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            Generating...
          </span>
        ) : (
          'Generate Description'
        )}
      </button>
    </div>
  );
}
