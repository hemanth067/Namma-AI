import React, { useState } from 'react';
import { SAMPLE_PROMPTS } from '../utils/language';
import { PromptStarter } from '../types';
import { 
  ArrowUpRight, 
  Globe, 
  ShieldCheck, 
  Zap, 
  MapPin, 
  PhoneCall, 
  Music, 
  Gamepad2, 
  Image as ImageIcon,
  Code2,
  BookOpen,
  Briefcase,
  Layers,
  Sparkles,
  Search
} from 'lucide-react';

interface WelcomeHeroProps {
  onSelectPrompt: (prompt: string) => void;
  onOpenGoogleMaps?: () => void;
  onOpenLiveVoice?: () => void;
  onOpenGame?: () => void;
  onOpenMusicStudio?: () => void;
  onOpenImageStudio?: () => void;
}

export const WelcomeHero: React.FC<WelcomeHeroProps> = ({ 
  onSelectPrompt,
  onOpenGoogleMaps,
  onOpenLiveVoice,
  onOpenGame,
  onOpenMusicStudio,
  onOpenImageStudio
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const filteredPrompts = activeCategory === 'all'
    ? SAMPLE_PROMPTS
    : SAMPLE_PROMPTS.filter((p) => p.category === activeCategory);

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 md:py-12 flex flex-col items-center">
      {/* Executive Header Lockup */}
      <div className="w-full flex flex-col items-center text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 rounded-full border border-neutral-200 dark:border-neutral-800 bg-neutral-100/80 dark:bg-neutral-900/80 text-[11px] font-medium text-neutral-600 dark:text-neutral-300">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Bilingual Intelligence Platform · இருமொழி செயற்கை நுண்ணறிவு</span>
        </div>

        <div className="flex items-center justify-center gap-3.5 mb-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-600 via-amber-700 to-amber-900 text-white flex items-center justify-center font-bold text-2xl shadow-md border border-amber-500/30">
            ந
          </div>
          <div className="text-left">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 font-sans">
              Namma AI Professional
            </h1>
            <p className="text-xs text-amber-700 dark:text-amber-400 font-semibold tracking-wide">
              நம்ம AI · என்டர்பிரைஸ் பணிமனை
            </p>
          </div>
        </div>

        <p className="text-sm text-neutral-600 dark:text-neutral-400 max-w-2xl leading-relaxed mt-1">
          High-performance bilingual workspace supporting authentic <strong>Tamil (தமிழ்)</strong>, 
          articulate <strong>English</strong>, and colloquial <strong>Tanglish</strong>. Features real-time language classification, 
          Google Search & Maps Grounding, low-latency live streaming, and multimodal audio tools.
        </p>
      </div>

      {/* Enterprise Platform Architecture Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full mb-8">
        <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 shadow-xs">
          <div className="flex items-center gap-1.5 text-neutral-500 text-[11px] mb-1">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span className="font-medium">Inference Engine</span>
          </div>
          <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
            Gemini 3.1 Flash-Lite
          </p>
          <span className="text-[10px] text-neutral-400">Ultra-fast stream responses</span>
        </div>

        <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 shadow-xs">
          <div className="flex items-center gap-1.5 text-neutral-500 text-[11px] mb-1">
            <Globe className="w-3.5 h-3.5 text-blue-500" />
            <span className="font-medium">Language Classifier</span>
          </div>
          <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
            Adaptive Bilingual
          </p>
          <span className="text-[10px] text-neutral-400">Tamil, Tanglish & English</span>
        </div>

        <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 shadow-xs">
          <div className="flex items-center gap-1.5 text-neutral-500 text-[11px] mb-1">
            <MapPin className="w-3.5 h-3.5 text-emerald-500" />
            <span className="font-medium">Geospatial Layer</span>
          </div>
          <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
            Google Maps Platform
          </p>
          <span className="text-[10px] text-neutral-400">Verified locations & routes</span>
        </div>

        <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 shadow-xs">
          <div className="flex items-center gap-1.5 text-neutral-500 text-[11px] mb-1">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-500" />
            <span className="font-medium">Architecture</span>
          </div>
          <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
            Server-Side Proxy
          </p>
          <span className="text-[10px] text-neutral-400">Protected API credentials</span>
        </div>
      </div>

      {/* Multimodal Quick Launch Dock */}
      <div className="w-full mb-8">
        <div className="flex items-center justify-between mb-2.5 px-0.5">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-neutral-400" />
            <span>Workspace Multimodal Tools · சிறப்பு கருவிகள்</span>
          </span>
          <span className="text-[11px] text-neutral-400">Integrated Modules</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {onOpenGoogleMaps && (
            <button
              onClick={onOpenGoogleMaps}
              className="group p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-emerald-500 dark:hover:border-emerald-600 transition-all text-left cursor-pointer shadow-xs"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                  <MapPin className="w-4 h-4" />
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-emerald-600 transition-transform group-hover:translate-x-0.5" />
              </div>
              <h3 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">Google Maps</h3>
              <p className="text-[11px] text-neutral-500">Tamil Nadu landmarks & live navigation</p>
            </button>
          )}

          {onOpenLiveVoice && (
            <button
              onClick={onOpenLiveVoice}
              className="group p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-amber-500 dark:hover:border-amber-600 transition-all text-left cursor-pointer shadow-xs"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
                  <PhoneCall className="w-4 h-4" />
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-amber-600 transition-transform group-hover:translate-x-0.5" />
              </div>
              <h3 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">Live Voice</h3>
              <p className="text-[11px] text-neutral-500">Real-time voice dialog with Gemini Live</p>
            </button>
          )}

          {onOpenImageStudio && (
            <button
              onClick={onOpenImageStudio}
              className="group p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-blue-500 dark:hover:border-blue-600 transition-all text-left cursor-pointer shadow-xs"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-blue-600 transition-transform group-hover:translate-x-0.5" />
              </div>
              <h3 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">Image Studio</h3>
              <p className="text-[11px] text-neutral-500">Text-to-visual artistic creation</p>
            </button>
          )}

          {onOpenMusicStudio && (
            <button
              onClick={onOpenMusicStudio}
              className="group p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-rose-500 dark:hover:border-rose-600 transition-all text-left cursor-pointer shadow-xs"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center">
                  <Music className="w-4 h-4" />
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-rose-600 transition-transform group-hover:translate-x-0.5" />
              </div>
              <h3 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">Music Studio</h3>
              <p className="text-[11px] text-neutral-500">Tamil instrumental & melody generator</p>
            </button>
          )}

          {onOpenGame && (
            <button
              onClick={onOpenGame}
              className="group p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-purple-500 dark:hover:border-purple-600 transition-all text-left cursor-pointer shadow-xs"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center">
                  <Gamepad2 className="w-4 h-4" />
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-purple-600 transition-transform group-hover:translate-x-0.5" />
              </div>
              <h3 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">3D Simulator</h3>
              <p className="text-[11px] text-neutral-500">Three.js Chennai coastal drive</p>
            </button>
          )}
        </div>
      </div>

      {/* Curated Prompt Library */}
      <div className="w-full text-left">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Suggested Workflows · தேர்ந்தெடுக்கப்பட்ட உரையாடல்கள்:</span>
          </h2>

          {/* Clean Segmented Filter Bar */}
          <div className="flex items-center gap-1 p-0.5 rounded-lg bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-[11px]">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                activeCategory === 'all'
                  ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-semibold shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveCategory('tamil')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                activeCategory === 'tamil'
                  ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-semibold shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
            >
              தமிழ் (Tamil)
            </button>
            <button
              onClick={() => setActiveCategory('tanglish')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                activeCategory === 'tanglish'
                  ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-semibold shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
            >
              Tanglish
            </button>
            <button
              onClick={() => setActiveCategory('mixed')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                activeCategory === 'mixed'
                  ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-semibold shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
            >
              Bilingual
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filteredPrompts.map((item: PromptStarter) => (
            <button
              key={item.id}
              onClick={() => onSelectPrompt(item.prompt)}
              className="group p-4 rounded-xl text-left border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/70 hover:border-amber-400 dark:hover:border-amber-500/80 hover:bg-amber-50/20 dark:hover:bg-amber-950/10 transition-all cursor-pointer shadow-xs"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">
                  {item.category === 'tamil' ? (
                    <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                  ) : item.category === 'tanglish' ? (
                    <Code2 className="w-3.5 h-3.5 text-indigo-600" />
                  ) : (
                    <Briefcase className="w-3.5 h-3.5 text-emerald-600" />
                  )}
                  <span>{item.categoryLabel}</span>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>

              <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 mb-1">
                {item.title}
              </h3>
              <p className="text-[12px] text-neutral-600 dark:text-neutral-400 line-clamp-2 leading-relaxed">
                "{item.prompt}"
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
