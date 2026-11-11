import React, { useState, useEffect, useRef } from 'react';
import { X, Mic, MicOff, Volume2, Sparkles, PhoneOff, Radio } from 'lucide-react';

interface LiveVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTranscriptReceived?: (userText: string, assistantText: string) => void;
}

export const LiveVoiceModal: React.FC<LiveVoiceModalProps> = ({
  isOpen,
  onClose,
  onTranscriptReceived,
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [liveStatus, setLiveStatus] = useState<'listening' | 'speaking' | 'idle'>('idle');
  const [userSpeech, setUserSpeech] = useState('');
  const [aiSpeech, setAiSpeech] = useState('');

  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIsConnected(true);
      setLiveStatus('listening');
      // Simulate live greeting in Tamil/English
      setTimeout(() => {
        setLiveStatus('speaking');
        setAiSpeech('வணக்கம்! நான் உங்கள் நம்ம AI. என்னிடம் நேரடியாகப் பேசலாம். (Hello! Speak naturally in Tamil or English)');
        setTimeout(() => setLiveStatus('listening'), 3000);
      }, 600);
    } else {
      setIsConnected(false);
      setLiveStatus('idle');
      setUserSpeech('');
      setAiSpeech('');
    }
  }, [isOpen]);

  const toggleMic = () => {
    setIsMicMuted(!isMicMuted);
  };

  const handleEndCall = () => {
    if (userSpeech && aiSpeech && onTranscriptReceived) {
      onTranscriptReceived(userSpeech, aiSpeech);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center">
        <button
          onClick={handleEndCall}
          className="absolute top-4 right-4 p-2 rounded-full text-neutral-400 hover:text-white bg-neutral-800/60"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Live Status Header */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold mb-6">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
          <span>Gemini 3.8 Live API Active</span>
        </div>

        {/* Pulsating Voice Orb Visualizer */}
        <div className="relative w-44 h-44 flex items-center justify-center my-4">
          <div
            className={`absolute inset-0 rounded-full transition-all duration-700 ${
              liveStatus === 'speaking'
                ? 'bg-amber-500/20 scale-125 animate-pulse'
                : liveStatus === 'listening'
                ? 'bg-emerald-500/20 scale-110 animate-pulse'
                : 'bg-neutral-800'
            }`}
          />
          <div
            className={`absolute w-32 h-32 rounded-full transition-all duration-500 ${
              liveStatus === 'speaking'
                ? 'bg-amber-600/40 scale-110'
                : liveStatus === 'listening'
                ? 'bg-emerald-600/30'
                : 'bg-neutral-800'
            }`}
          />
          <div className="relative w-24 h-24 rounded-full bg-gradient-to-tr from-amber-600 to-amber-500 text-white flex items-center justify-center font-bold text-3xl shadow-lg border border-amber-400/40">
            {liveStatus === 'speaking' ? (
              <Volume2 className="w-10 h-10 animate-bounce" />
            ) : (
              <Mic className="w-10 h-10" />
            )}
          </div>
        </div>

        {/* Status Text */}
        <p className="text-sm font-semibold text-neutral-200 mt-2">
          {liveStatus === 'speaking'
            ? 'நம்ம AI பேசுகிறது · AI Speaking...'
            : liveStatus === 'listening'
            ? 'கேட்கிறது · Listening (Tamil / English / Tanglish)...'
            : 'Connecting...'}
        </p>

        {/* Spoken Subtitles / Live Transcript Box */}
        <div className="w-full min-h-[70px] bg-neutral-950/80 border border-neutral-800 rounded-2xl p-3 my-5 text-xs text-neutral-300 leading-relaxed flex items-center justify-center">
          <p className="line-clamp-3">
            {aiSpeech || userSpeech || 'Start speaking naturally. Speak in Tamil script, Tanglish, or English.'}
          </p>
        </div>

        {/* Controls Bar */}
        <div className="flex items-center gap-4 mt-2">
          <button
            onClick={toggleMic}
            className={`p-3.5 rounded-full border transition-all ${
              isMicMuted
                ? 'bg-rose-600/20 border-rose-500 text-rose-400'
                : 'bg-neutral-800 border-neutral-700 text-neutral-200 hover:bg-neutral-700'
            }`}
            title={isMicMuted ? 'Unmute microphone' : 'Mute microphone'}
          >
            {isMicMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          <button
            onClick={handleEndCall}
            className="p-3.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white shadow-lg transition-transform active:scale-95"
            title="End voice conversation"
          >
            <PhoneOff className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
