
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { Key } from 'lucide-react';

interface ApiKeyDialogProps {
  onContinue: () => void;
}

const ApiKeyDialog: React.FC<ApiKeyDialogProps> = ({ onContinue }) => {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-opacity duration-300">
      <div className="bg-neutral-900/60 border border-white/10 backdrop-blur-2xl rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] max-w-md w-full p-8 text-center flex flex-col items-center ring-1 ring-white/5 relative overflow-hidden">
        
        {/* Decorative glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-20 bg-white/5 blur-3xl pointer-events-none"></div>

        <div className="bg-white/5 p-5 rounded-full mb-6 ring-1 ring-white/10 shadow-[inset_0_0_20px_rgba(255,255,255,0.05)] relative z-10">
          <Key className="w-8 h-8 text-white opacity-90" />
        </div>
        
        <h2 className="text-2xl font-bold text-white mb-3 font-bogle tracking-wide drop-shadow-md">Setup Required</h2>
        
        <p className="text-gray-300 mb-8 text-sm leading-relaxed font-light">
          Cameo Studio uses the Veo model, which requires an API key from a Google Cloud project with billing enabled.
        </p>
        
        <button
          onClick={onContinue}
          className="w-full px-6 py-3.5 bg-white hover:bg-gray-100 text-black font-bold rounded-xl transition-all text-sm tracking-wider uppercase shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:-translate-y-0.5"
        >
          Select API Key
        </button>

        <p className="text-gray-500 mt-6 text-xs font-medium">
          Read more about{' '}
          <a
            href="https://ai.google.dev/gemini-api/docs/billing"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white hover:text-gray-300 transition-colors underline underline-offset-2 decoration-white/30 hover:decoration-white"
          >
            billing
          </a>{' '}
          and{' '}
          <a
            href="https://ai.google.dev/gemini-api/docs/pricing#veo-3"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white hover:text-gray-300 transition-colors underline underline-offset-2 decoration-white/30 hover:decoration-white"
          >
            pricing
          </a>.
        </p>
      </div>
    </div>
  );
};

export default ApiKeyDialog;