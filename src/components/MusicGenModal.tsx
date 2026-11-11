import React, { useState, useRef, useEffect } from 'react';
import { X, Music, Play, Pause, Sparkles, Download, MessageSquarePlus, Volume2 } from 'lucide-react';

interface MusicGenModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertIntoChat: (musicMarkdown: string) => void;
}

interface MusicPreset {
  id: string;
  title: string;
  titleTa: string;
  genre: string;
  bpm: number;
  scale: number[];
  description: string;
}

const TAMIL_MUSIC_PRESETS: MusicPreset[] = [
  {
    id: 'carnatic_flute',
    title: 'Carnatic Mohanam Raga Flute',
    titleTa: 'மோகன ராக வேணுகானம்',
    genre: 'Classical Carnatic',
    bpm: 72,
    scale: [261.63, 293.66, 329.63, 392.00, 440.00, 523.25], // Sa Ri Ga Pa Dha Sa
    description: 'Serene, uplifting pentatonic melody in traditional Mohana ragam.'
  },
  {
    id: 'kuthu_beat',
    title: 'Chennai Marana Gana Kuthu Beat',
    titleTa: 'சென்னை கானா குத்து இசை',
    genre: 'Folk / Dappankuthu',
    bpm: 135,
    scale: [220.00, 246.94, 261.63, 293.66, 329.63, 349.23],
    description: 'High-energy festive street percussion rhythm popular across Tamil Nadu.'
  },
  {
    id: 'kollywood_strings',
    title: 'Nocturnal Kollywood Strings & Ambient',
    titleTa: 'இரவு நேர மெல்லிசை',
    genre: 'Cinematic Ambient',
    bpm: 80,
    scale: [220.00, 261.63, 293.66, 329.63, 392.00, 440.00],
    description: 'Soulful string harmonies inspired by classic Tamil cinema compositions.'
  }
];

export const MusicGenModal: React.FC<MusicGenModalProps> = ({ isOpen, onClose, onInsertIntoChat }) => {
  const [selectedPreset, setSelectedPreset] = useState<MusicPreset>(TAMIL_MUSIC_PRESETS[0]);
  const [prompt, setPrompt] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<any>(null);

  const playSynthNote = (freq: number, duration: number, type: OscillatorType = 'sine') => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      console.warn('Audio synth error:', e);
    }
  };

  const playPercussion = (isKick: boolean) => {
    try {
      if (!audioCtxRef.current) return;
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = isKick ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(isKick ? 120 : 250, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(isKick ? 0.35 : 0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.12);
    } catch (e) {}
  };

  const togglePlay = () => {
    if (isPlaying) {
      clearInterval(timerRef.current);
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      let step = 0;
      const interval = (60 / selectedPreset.bpm / 2) * 1000;

      timerRef.current = setInterval(() => {
        const noteIdx = Math.floor(Math.random() * selectedPreset.scale.length);
        const freq = selectedPreset.scale[noteIdx];

        if (selectedPreset.id === 'kuthu_beat') {
          playSynthNote(freq * 0.5, 0.2, 'sawtooth');
          if (step % 2 === 0) playPercussion(step % 4 === 0);
        } else {
          playSynthNote(freq, 0.45, 'sine');
        }

        step = (step + 1) % 16;
        setActiveStep(step);
      }, interval);
    }
  };

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  const handleSendToChat = () => {
    const md = `🎵 **${selectedPreset.title}** (${selectedPreset.titleTa})\n*Genre:* ${selectedPreset.genre} · *Tempo:* ${selectedPreset.bpm} BPM\n${selectedPreset.description}`;
    onInsertIntoChat(md);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-2xl">
        <button
          onClick={() => {
            if (isPlaying) togglePlay();
            onClose();
          }}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold">
            <Music className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
              Music Studio · இசை அரங்கம்
            </h2>
            <p className="text-xs text-neutral-500">
              Procedural & Lyria-3 Tamil music clip generation
            </p>
          </div>
        </div>

        {/* Style Presets */}
        <div className="space-y-2 mb-4">
          <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
            Select Music Style / இசை வகை:
          </label>
          <div className="grid grid-cols-1 gap-2">
            {TAMIL_MUSIC_PRESETS.map((p) => {
              const isSelected = selectedPreset.id === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => {
                    if (isPlaying) togglePlay();
                    setSelectedPreset(p);
                  }}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'border-rose-500 bg-rose-50/70 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 shadow-xs'
                      : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-800/60 text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">{p.title}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 font-mono">
                      {p.bpm} BPM
                    </span>
                  </div>
                  <p className="text-[11px] text-rose-700 dark:text-rose-400 font-medium">{p.titleTa}</p>
                  <p className="text-[11px] text-neutral-500 mt-1">{p.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Visualizer Beat Matrix */}
        <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 mb-5 flex flex-col items-center justify-center">
          <div className="flex items-center gap-1.5 h-10 mb-2">
            {Array.from({ length: 16 }).map((_, idx) => (
              <div
                key={idx}
                className={`w-2.5 rounded-full transition-all ${
                  activeStep === idx && isPlaying
                    ? 'h-10 bg-rose-500 shadow-sm shadow-rose-500'
                    : 'h-3 bg-neutral-800'
                }`}
              />
            ))}
          </div>
          <span className="text-[11px] text-neutral-400 font-mono">
            {isPlaying ? 'Synthesizing Audio Stream...' : 'Ready to play'}
          </span>
        </div>

        {/* Play & Send Controls */}
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={togglePlay}
            className={`flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all ${
              isPlaying
                ? 'bg-rose-600 text-white'
                : 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800'
            }`}
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            <span>{isPlaying ? 'Pause Melody · நிறுத்து' : 'Play Live Melody · இசை'}</span>
          </button>

          <button
            onClick={handleSendToChat}
            className="px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-medium flex items-center gap-1.5"
          >
            <MessageSquarePlus className="w-4 h-4" />
            <span>Send to Chat</span>
          </button>
        </div>
      </div>
    </div>
  );
};
