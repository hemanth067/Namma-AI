import React, { useState } from 'react';
import { X, Sparkles, Download, MessageSquarePlus, Image as ImageIcon, Loader2 } from 'lucide-react';

interface ImageGenModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertIntoChat: (imageMarkdown: string) => void;
}

export const ImageGenModal: React.FC<ImageGenModalProps> = ({ isOpen, onClose, onInsertIntoChat }) => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '9:16'>('1:1');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const samplePrompts = [
    'Traditional Tamil Pongal festival celebration with clay pot and sugarcane, warm golden hour',
    'Futuristic Chennai skyline with solar metro trains and Marina lighthouse, cyberpunk aesthetic',
    'Intricate sacred geometric Kolam Rangoli pattern glowing with festive oil lamps',
    'Majestic Thanjavur Brihadisvara Temple with dramatic clouds and cinematic lighting'
  ];

  const handleGenerate = async (targetPrompt?: string) => {
    const finalPrompt = targetPrompt || prompt;
    if (!finalPrompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setError(null);
    try {
      const res = await fetch('/api/image/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: finalPrompt, aspectRatio }),
      });
      const data = await res.json();
      if (data.imageUrl) {
        setGeneratedImageUrl(data.imageUrl);
      } else {
        throw new Error(data.error || 'Failed to generate image');
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Generation failed. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendToChat = () => {
    if (!generatedImageUrl) return;
    const md = `![${prompt || 'Generated Image'}](${generatedImageUrl})\n\n*Prompt:* ${prompt}`;
    onInsertIntoChat(md);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold">
            <ImageIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
              AI Image Studio · படம் உருவாக்கு
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Generate images from Tamil & English text descriptions
            </p>
          </div>
        </div>

        {/* Prompt Input */}
        <div className="space-y-3 mb-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Description / என்ன படம் வேண்டும்:
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Tamil traditional Bharatanatyam dancer in temple hall, golden lighting..."
              rows={3}
              className="w-full p-3 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          {/* Quick Idea Starters */}
          <div className="flex flex-wrap gap-1.5">
            {samplePrompts.map((s, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setPrompt(s);
                  handleGenerate(s);
                }}
                className="text-[11px] px-2.5 py-1 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/60 hover:border-amber-400 text-neutral-600 dark:text-neutral-300 text-left transition-colors"
              >
                {s.slice(0, 35)}...
              </button>
            ))}
          </div>

          {/* Aspect Ratio Selector */}
          <div className="flex items-center gap-2 pt-1">
            <span className="text-xs text-neutral-500">Aspect Ratio:</span>
            {(['1:1', '16:9', '9:16'] as const).map((ratio) => (
              <button
                key={ratio}
                onClick={() => setAspectRatio(ratio)}
                className={`px-3 py-1 rounded-md text-xs font-medium border transition-colors ${
                  aspectRatio === ratio
                    ? 'border-amber-600 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-semibold'
                    : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400'
                }`}
              >
                {ratio}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p className="text-xs text-rose-600 dark:text-rose-400 mb-3">{error}</p>
        )}

        <button
          onClick={() => handleGenerate()}
          disabled={!prompt.trim() || isGenerating}
          className={`w-full py-2.5 rounded-xl font-medium text-xs flex items-center justify-center gap-2 transition-all shadow-xs ${
            prompt.trim() && !isGenerating
              ? 'bg-amber-600 hover:bg-amber-500 text-white cursor-pointer'
              : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed'
          }`}
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Generating Image · படம் உருவாகிறது...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Generate Image · உருவாக்கு</span>
            </>
          )}
        </button>

        {/* Generated Image Result */}
        {generatedImageUrl && (
          <div className="mt-6 pt-4 border-t border-neutral-200 dark:border-neutral-800">
            <div className="rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-neutral-900 flex items-center justify-center max-h-72 mb-3">
              <img
                src={generatedImageUrl}
                alt={prompt}
                className="max-h-72 w-auto object-contain"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <a
                href={generatedImageUrl}
                download="namma-ai-image.png"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </a>
              <button
                onClick={handleSendToChat}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800"
              >
                <MessageSquarePlus className="w-3.5 h-3.5" />
                <span>Send to Chat</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
