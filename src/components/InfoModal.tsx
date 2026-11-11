import React from 'react';
import { X, Globe, Shield, Sparkles, CheckCircle2 } from 'lucide-react';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold text-lg">
            ந
          </div>
          <div>
            <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
              About Namma AI · நம்ம AI பற்றி
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Tamil & English Intelligent Conversational Companion
            </p>
          </div>
        </div>

        <div className="space-y-4 text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
          <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40">
            <h3 className="font-semibold text-amber-900 dark:text-amber-300 mb-1 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" />
              <span>Language Understanding</span>
            </h3>
            <p>
              Namma AI is trained to understand three distinct communication styles:
            </p>
            <ul className="mt-2 space-y-1 list-disc pl-4 text-neutral-700 dark:text-neutral-300">
              <li><strong>Tamil script (தமிழ்)</strong>: Replies in authentic, natural Tamil.</li>
              <li><strong>English</strong>: Professional, articulate English answers.</li>
              <li><strong>Tanglish (Tamil in English letters)</strong>: e.g. <em>"Enna panreenga?"</em>, <em>"Romba nandri"</em>. Replies warmly in conversational Tanglish.</li>
              <li><strong>Mixed / Code-Switching</strong>: Blended sentences like <em>"AI pathi explain pannunga"</em>.</li>
            </ul>
          </div>

          <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800">
            <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-1 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Secure AI Architecture</span>
            </h3>
            <p>
              Your API requests are processed safely via server-side endpoints with zero API keys exposed to client browser bundles. Powered by Gemini 3.8 Flash.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800">
            <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Beginner-Friendly Tips</span>
            </h3>
            <p>
              You don't need any special formatting or language toggles! Just type naturally the way you converse with friends or colleagues in Tamil Nadu, and Namma AI mirrors your language.
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors"
          >
            Got it · புரிந்தது
          </button>
        </div>
      </div>
    </div>
  );
};
