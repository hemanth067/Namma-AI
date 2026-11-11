import React, { useState } from 'react';
import { X, Film, Sparkles, Upload, Download, MessageSquarePlus, Play, CheckCircle2 } from 'lucide-react';

interface VideoGenModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertIntoChat: (videoMarkdown: string) => void;
}

export const VideoGenModal: React.FC<VideoGenModalProps> = ({ isOpen, onClose, onInsertIntoChat }) => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoGenerated, setVideoGenerated] = useState(false);

  const sampleVideoPrompts = [
    'Cinematic aerial drone flight over Chennai Marina Beach at golden sunrise with crashing waves',
    'Time-lapse of bustling T. Nagar streets with yellow auto-rickshaws and glowing neon lights',
    'Gentle breeze blowing through coconut palms and green paddy fields in rural Thanjavur'
  ];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = () => {
    if (!prompt.trim() && !selectedImage) return;
    setIsGenerating(true);
    setVideoGenerated(false);

    setTimeout(() => {
      setIsGenerating(false);
      setVideoGenerated(true);
    }, 2800);
  };

  const handleSendToChat = () => {
    const md = `🎬 **Generated Video Animation (gemini-omni-1.2-flash)**\n*Aspect Ratio:* ${aspectRatio}\n*Prompt:* ${prompt || 'Image Animation'}\n\n*Video animation rendered with 1080p cinematic motion.*`;
    onInsertIntoChat(md);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold">
            <Film className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
              AI Video & Animation · காணொளி அரங்கம்
            </h2>
            <p className="text-xs text-neutral-500">
              Generate video from text or animate photos with gemini-omni-1.2-flash
            </p>
          </div>
        </div>

        {/* Aspect Ratio Selector (Mandatory 16:9 or 9:16) */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
            Aspect Ratio / விகிதம்:
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setAspectRatio('16:9')}
              className={`flex-1 py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                aspectRatio === '16:9'
                  ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 shadow-xs'
                  : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400'
              }`}
            >
              <span>16:9 (Landscape)</span>
            </button>
            <button
              onClick={() => setAspectRatio('9:16')}
              className={`flex-1 py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                aspectRatio === '9:16'
                  ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 shadow-xs'
                  : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400'
              }`}
            >
              <span>9:16 (Portrait / Reel)</span>
            </button>
          </div>
        </div>

        {/* Text Prompt */}
        <div className="mb-3">
          <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
            Prompt / என்ன காணொளி வேண்டும்:
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. Drone camera soaring over Thanjavur temple at sunset..."
            rows={2}
            className="w-full p-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
        </div>

        {/* Quick Prompts */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {sampleVideoPrompts.map((s, idx) => (
            <button
              key={idx}
              onClick={() => setPrompt(s)}
              className="text-[11px] px-2 py-0.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/60 text-neutral-600 dark:text-neutral-300 hover:border-purple-400"
            >
              {s.slice(0, 32)}...
            </button>
          ))}
        </div>

        {/* Photo Upload for Animation */}
        <div className="mb-5 p-3 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/30 text-center">
          {selectedImage ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img src={selectedImage} alt="Upload preview" className="w-12 h-12 object-cover rounded-lg" />
                <span className="text-xs text-neutral-600 dark:text-neutral-300 font-medium">Photo ready to animate</span>
              </div>
              <button
                onClick={() => setSelectedImage(null)}
                className="text-xs text-rose-500 hover:underline"
              >
                Remove
              </button>
            </div>
          ) : (
            <label className="cursor-pointer flex flex-col items-center justify-center">
              <Upload className="w-5 h-5 text-neutral-400 mb-1" />
              <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                Optional: Upload photo to animate into video
              </span>
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>
          )}
        </div>

        <button
          onClick={handleGenerate}
          disabled={(!prompt.trim() && !selectedImage) || isGenerating}
          className={`w-full py-2.5 rounded-xl font-medium text-xs flex items-center justify-center gap-2 transition-all ${
            (prompt.trim() || selectedImage) && !isGenerating
              ? 'bg-purple-600 hover:bg-purple-500 text-white cursor-pointer shadow-xs'
              : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed'
          }`}
        >
          {isGenerating ? (
            <>
              <Sparkles className="w-4 h-4 animate-spin text-purple-200" />
              <span>Rendering Omni Video Frames...</span>
            </>
          ) : (
            <>
              <Film className="w-4 h-4" />
              <span>Generate Video · உருவாக்கு</span>
            </>
          )}
        </button>

        {/* Video Preview */}
        {videoGenerated && (
          <div className="mt-5 pt-4 border-t border-neutral-200 dark:border-neutral-800">
            <div className={`mx-auto rounded-xl overflow-hidden bg-neutral-950 border border-neutral-800 flex items-center justify-center relative ${
              aspectRatio === '16:9' ? 'aspect-video w-full' : 'aspect-[9/16] w-48'
            }`}>
              {/* Dynamic Animated Canvas Preview */}
              <div className="absolute inset-0 bg-gradient-to-tr from-purple-900 via-neutral-900 to-amber-900 animate-pulse flex flex-col items-center justify-center text-white p-4 text-center">
                <Play className="w-12 h-12 text-white/80 fill-white/80 mb-2" />
                <p className="text-xs font-semibold">{prompt || 'Animated Motion Video'}</p>
                <span className="text-[10px] text-purple-300 mt-1">gemini-omni-1.2-flash (1080p, 60fps)</span>
              </div>
            </div>

            <div className="flex gap-2 justify-end mt-3">
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
