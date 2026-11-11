import React, { useState, useRef, useEffect } from 'react';
import { 
  Menu, 
  Send, 
  Square, 
  Sparkles, 
  Copy, 
  Check, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  Plus, 
  Moon, 
  Sun,
  Globe2,
  ArrowDown,
  Mic,
  MicOff,
  Search,
  MapPin,
  Zap,
  Image as ImageIcon,
  Gamepad2,
  ExternalLink,
  Radio,
  Map,
  Music,
  Film,
  PhoneCall,
  User,
  Activity
} from 'lucide-react';
import { ChatSession, ChatMessage, LanguageType } from '../types';
import { detectLanguageClient, getLanguageMeta } from '../utils/language';
import { MarkdownRenderer } from './MarkdownRenderer';
import { WelcomeHero } from './WelcomeHero';

interface ChatAreaProps {
  session: ChatSession | null;
  isStreaming: boolean;
  streamingContent: string;
  streamingLanguage: LanguageType | null;
  streamingSources: any[];
  errorMessage: string | null;
  modelMode: 'turbo' | 'pro';
  onChangeModelMode: (mode: 'turbo' | 'pro') => void;
  useSearch: boolean;
  onToggleSearch: () => void;
  useMaps: boolean;
  onToggleMaps: () => void;
  onSendMessage: (text: string) => void;
  onStopStreaming: () => void;
  onRegenerate: () => void;
  onNewChat: () => void;
  onToggleSidebar: () => void;
  onOpenGame: () => void;
  onOpenImageStudio: () => void;
  onOpenGoogleMaps: () => void;
  onOpenLiveVoice: () => void;
  onOpenMusicStudio: () => void;
  onOpenVideoGen: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  session,
  isStreaming,
  streamingContent,
  streamingLanguage,
  streamingSources,
  errorMessage,
  modelMode,
  onChangeModelMode,
  useSearch,
  onToggleSearch,
  useMaps,
  onToggleMaps,
  onSendMessage,
  onStopStreaming,
  onRegenerate,
  onNewChat,
  onToggleSidebar,
  onOpenGame,
  onOpenImageStudio,
  onOpenGoogleMaps,
  onOpenLiveVoice,
  onOpenMusicStudio,
  onOpenVideoGen,
  isDarkMode,
  onToggleTheme,
}) => {
  const [inputText, setInputText] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  // Audio Recording State for gemini-3.5-transcribe
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<any>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const liveDetectedLang = inputText.trim() ? detectLanguageClient(inputText) : null;
  const liveMeta = liveDetectedLang ? getLanguageMeta(liveDetectedLang) : null;

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(textareaRef.current.scrollHeight, 180);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [inputText]);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom(isStreaming ? 'auto' : 'smooth');
  }, [session?.messages, streamingContent, isStreaming]);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const distanceToBottom = scrollHeight - scrollTop - clientHeight;
    setShowScrollBottom(distanceToBottom > 150);
  };

  const handleSend = () => {
    if (!inputText.trim() || isStreaming) return;
    const text = inputText.trim();
    setInputText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    onSendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSpeak = (text: string, id: string, langHint?: LanguageType) => {
    if (!('speechSynthesis' in window)) return;

    if (speakingId === id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    if (langHint === 'tamil') {
      const tamilVoice = voices.find((v) => v.lang.startsWith('ta'));
      if (tamilVoice) utterance.voice = tamilVoice;
      utterance.lang = 'ta-IN';
    } else {
      const indianOrEngVoice = voices.find((v) => v.lang === 'en-IN') || voices.find((v) => v.lang.startsWith('en'));
      if (indianOrEngVoice) utterance.voice = indianOrEngVoice;
      utterance.lang = 'en-US';
    }

    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);

    setSpeakingId(id);
    window.speechSynthesis.speak(utterance);
  };

  // Microphone Audio Recording & Transcribe via gemini-3.5-transcribe
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach((track) => track.stop());

        setIsTranscribing(true);
        try {
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            const base64Data = (reader.result as string).split(',')[1];
            const response = await fetch('/api/transcribe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ audioBase64: base64Data, mimeType: 'audio/webm' }),
            });
            const data = await response.json();
            if (data.text) {
              setInputText((prev) => (prev ? `${prev} ${data.text}` : data.text));
              textareaRef.current?.focus();
            }
            setIsTranscribing(false);
          };
        } catch (e) {
          console.error(e);
          setIsTranscribing(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      recordTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone permission or recording error:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(recordTimerRef.current);
    }
  };

  const hasMessages = session && session.messages.length > 0;

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50/50 dark:bg-neutral-950 overflow-hidden relative">
      {/* Top Executive Navigation Bar */}
      <header className="h-14 border-b border-neutral-200/90 dark:border-neutral-800 px-3 sm:px-5 flex items-center justify-between gap-3 shrink-0 bg-white/90 dark:bg-neutral-950/90 backdrop-blur-md z-10">
        {/* Left Zone: Sidebar toggle, Workspace Context & Engine Indicator */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-1.5 sm:p-2 rounded-lg text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            aria-label="Toggle navigation drawer"
          >
            <Menu className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm tracking-tight text-neutral-900 dark:text-neutral-100">
                Namma AI
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse hidden sm:inline-block" title="System Online" />
            </div>
            <span className="text-neutral-300 dark:text-neutral-700">/</span>
            <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium truncate max-w-[110px] sm:max-w-[180px] md:max-w-[260px]">
              {session?.title || 'New Workspace'}
            </span>
          </div>
        </div>

        {/* Center Zone: Model Selector & Multimodal Quick Triggers */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Segmented Model Switcher */}
          <div className="flex items-center p-0.5 rounded-lg bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-[11px]">
            <button
              onClick={() => onChangeModelMode('turbo')}
              className={`flex items-center gap-1 px-2 py-1 rounded-md transition-all cursor-pointer ${
                modelMode === 'turbo'
                  ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-xs font-semibold'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
              title="Ultra-fast streaming with gemini-3.1-flash-lite"
            >
              <Zap className="w-3 h-3 text-amber-500" />
              <span>Turbo</span>
            </button>
            <button
              onClick={() => onChangeModelMode('pro')}
              className={`flex items-center gap-1 px-2 py-1 rounded-md transition-all cursor-pointer ${
                modelMode === 'pro'
                  ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-xs font-semibold'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
              title="Deep analysis with gemini-3.8-flash"
            >
              <Sparkles className="w-3 h-3 text-indigo-500" />
              <span>Smart</span>
            </button>
          </div>

          {/* Google Maps Platform Modal Button */}
          <button
            onClick={onOpenGoogleMaps}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 text-xs font-medium hover:border-emerald-500 hover:text-emerald-600 transition-colors shadow-xs"
            title="Open Google Maps Platform explorer"
          >
            <Map className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Maps</span>
          </button>

          {/* Live Voice Duplex Button */}
          <button
            onClick={onOpenLiveVoice}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-amber-500/80 bg-amber-500 text-white text-xs font-semibold hover:bg-amber-600 transition-colors shadow-xs"
            title="Start real-time voice conversation with Gemini 3.8 Live"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Live Voice</span>
          </button>

          {/* Image Studio */}
          <button
            onClick={onOpenImageStudio}
            className="hidden lg:flex items-center gap-1.5 px-2 py-1 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 text-xs font-medium hover:border-neutral-400 transition-colors"
            title="Create image from text"
          >
            <ImageIcon className="w-3.5 h-3.5 text-blue-500" />
            <span>Image</span>
          </button>

          {/* Music Studio */}
          <button
            onClick={onOpenMusicStudio}
            className="hidden xl:flex items-center gap-1.5 px-2 py-1 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 text-xs font-medium hover:border-neutral-400 transition-colors"
            title="Generate Tamil & Indian musical melodies"
          >
            <Music className="w-3.5 h-3.5 text-rose-500" />
            <span>Music</span>
          </button>

          {/* 3D Game Simulator */}
          <button
            onClick={onOpenGame}
            className="hidden xl:flex items-center gap-1.5 px-2 py-1 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 text-xs font-medium hover:border-neutral-400 transition-colors"
            title="Play Chennai Cruiser 3D Three.js game"
          >
            <Gamepad2 className="w-3.5 h-3.5 text-purple-500" />
            <span>3D</span>
          </button>
        </div>

        {/* Right Zone: Theme Switcher & New Chat */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={onToggleTheme}
            className="p-1.5 sm:p-2 rounded-lg text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            aria-label="Toggle theme"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            onClick={onNewChat}
            className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-white text-xs font-semibold transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Chat</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Stream Area */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 sm:px-6 py-6"
      >
        {!hasMessages && !isStreaming ? (
          <WelcomeHero 
            onSelectPrompt={(prompt) => {
              setInputText(prompt);
              textareaRef.current?.focus();
            }}
            onOpenGoogleMaps={onOpenGoogleMaps}
            onOpenLiveVoice={onOpenLiveVoice}
            onOpenGame={onOpenGame}
            onOpenMusicStudio={onOpenMusicStudio}
            onOpenImageStudio={onOpenImageStudio}
          />
        ) : (
          <div className="max-w-3xl mx-auto space-y-6 pb-24">
            {session?.messages.map((message: ChatMessage) => {
              const isUser = message.role === 'user';
              const langMeta = message.detectedLanguage ? getLanguageMeta(message.detectedLanguage) : null;

              return (
                <div
                  key={message.id}
                  className={`flex gap-3.5 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-600 to-amber-800 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-1 shadow-xs">
                      ந
                    </div>
                  )}

                  <div
                    className={`relative max-w-[88%] sm:max-w-[82%] rounded-2xl p-4 sm:p-5 ${
                      isUser
                        ? 'bg-neutral-900 text-white dark:bg-neutral-800 dark:text-neutral-100 rounded-tr-xs shadow-xs'
                        : 'bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 rounded-tl-xs shadow-xs text-neutral-900 dark:text-neutral-100'
                    }`}
                  >
                    {/* Header line for Assistant (clean typography, no pill boxes) */}
                    {!isUser && (
                      <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 mb-2.5 pb-2 border-b border-neutral-100 dark:border-neutral-800/80">
                        <div className="flex items-center gap-1.5 font-semibold text-neutral-800 dark:text-neutral-200">
                          <span>Namma AI</span>
                          {langMeta && (
                            <>
                              <span className="text-neutral-300 dark:text-neutral-700" aria-hidden="true">·</span>
                              <span className="text-[11px] font-medium text-amber-700 dark:text-amber-400">
                                {langMeta.label}
                              </span>
                            </>
                          )}
                        </div>

                        <span className="text-[11px] text-neutral-400">
                          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    )}

                    {isUser ? (
                      <p className="text-[14px] leading-relaxed whitespace-pre-wrap break-words">
                        {message.content}
                      </p>
                    ) : (
                      <>
                        <MarkdownRenderer content={message.content} />

                        {/* Grounding Sources (Search & Maps) */}
                        {message.sources && message.sources.length > 0 && (
                          <div className="mt-3.5 pt-2.5 border-t border-neutral-100 dark:border-neutral-800">
                            <p className="text-[11px] font-semibold text-neutral-500 mb-1.5 flex items-center gap-1">
                              <ExternalLink className="w-3 h-3 text-neutral-400" />
                              <span>Verified Sources & Locations · தகவல் ஆதாரங்கள்:</span>
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {message.sources.map((chunk: any, sIdx: number) => {
                                const web = chunk.web;
                                const map = chunk.maps;
                                if (web?.uri) {
                                  return (
                                    <a
                                      key={sIdx}
                                      href={web.uri}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-[11px] text-blue-600 dark:text-blue-400 hover:underline border border-neutral-200 dark:border-neutral-700"
                                    >
                                      <Search className="w-2.5 h-2.5" />
                                      <span className="truncate max-w-[180px]">{web.title || web.uri}</span>
                                    </a>
                                  );
                                }
                                if (map?.uri) {
                                  return (
                                    <a
                                      key={sIdx}
                                      href={map.uri}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-[11px] text-emerald-700 dark:text-emerald-300 hover:underline border border-emerald-200 dark:border-emerald-800"
                                    >
                                      <MapPin className="w-2.5 h-2.5" />
                                      <span className="truncate max-w-[180px]">{map.title || 'Google Maps Place'}</span>
                                    </a>
                                  );
                                }
                                return null;
                              })}
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {!isUser && (
                      <div className="mt-3 pt-2 border-t border-neutral-100 dark:border-neutral-800/60 flex items-center justify-between text-neutral-400 text-xs">
                        <span className="text-[10px] text-neutral-400">
                          {modelMode === 'turbo' ? 'Gemini 3.1 Flash-Lite' : 'Gemini 3.8 Flash'}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleSpeak(message.content, message.id, message.detectedLanguage)}
                            className="p-1 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors"
                            title={speakingId === message.id ? 'Stop reading' : 'Read aloud'}
                          >
                            {speakingId === message.id ? (
                              <VolumeX className="w-3.5 h-3.5 text-rose-500" />
                            ) : (
                              <Volume2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            onClick={() => copyToClipboard(message.content, message.id)}
                            className="p-1 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors"
                            title="Copy response"
                          >
                            {copiedId === message.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {isUser && (
                    <div className="w-7 h-7 rounded-lg bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 flex items-center justify-center shrink-0 mt-1">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Live Streaming Assistant Message */}
            {isStreaming && (
              <div className="flex gap-3.5 justify-start">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-600 to-amber-800 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-1 shadow-xs">
                  ந
                </div>
                <div className="relative max-w-[88%] sm:max-w-[82%] rounded-2xl rounded-tl-xs p-4 sm:p-5 bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 shadow-xs text-neutral-900 dark:text-neutral-100">
                  <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 mb-2.5 pb-2 border-b border-neutral-100 dark:border-neutral-800/80">
                    <div className="flex items-center gap-1.5 font-semibold text-neutral-800 dark:text-neutral-200">
                      <span>Namma AI</span>
                      {streamingLanguage && (
                        <>
                          <span className="text-neutral-300 dark:text-neutral-700" aria-hidden="true">·</span>
                          <span className="text-[11px] font-medium text-amber-700 dark:text-amber-400">
                            {getLanguageMeta(streamingLanguage).label}
                          </span>
                        </>
                      )}
                    </div>
                    <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium animate-pulse">
                      Generating...
                    </span>
                  </div>

                  {streamingContent ? (
                    <MarkdownRenderer content={streamingContent} />
                  ) : (
                    <div className="flex items-center gap-2 py-3 text-xs text-neutral-500">
                      <span className="w-2 h-2 rounded-full bg-amber-600 animate-ping" />
                      <span>சிந்திக்கிறது · Streaming tokens...</span>
                    </div>
                  )}

                  <span className="inline-block w-2 h-4 bg-amber-600 dark:bg-amber-400 animate-pulse ml-0.5 align-middle" />
                </div>
              </div>
            )}

            {/* Error Message */}
            {errorMessage && (
              <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-800 dark:text-rose-300 flex items-center justify-between">
                <p>{errorMessage}</p>
                <button
                  onClick={onRegenerate}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition-colors shrink-0 ml-3 font-semibold"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Retry</span>
                </button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Floating Scroll to Bottom Button */}
      {showScrollBottom && (
        <button
          onClick={() => scrollToBottom('smooth')}
          className="absolute bottom-28 right-6 p-2 rounded-full bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 shadow-md hover:scale-105 transition-all z-20 cursor-pointer"
          aria-label="Scroll to newest message"
        >
          <ArrowDown className="w-4 h-4" />
        </button>
      )}

      {/* Executive Command Input Dock */}
      <footer className="shrink-0 p-3 sm:p-4 bg-white/95 dark:bg-neutral-950/95 border-t border-neutral-200/90 dark:border-neutral-800 backdrop-blur-md">
        <div className="max-w-3xl mx-auto">
          {/* Grounding & Language Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-1 mb-2 text-xs">
            <div className="flex items-center gap-2">
              {liveMeta ? (
                <div className="flex items-center gap-1 text-[11px]">
                  <span className="text-neutral-400">Language:</span>
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                    {liveMeta.label}
                  </span>
                  <span className="text-neutral-400">({liveMeta.subLabel})</span>
                </div>
              ) : (
                <span className="text-[11px] text-neutral-400">
                  தமிழ் · English · Tanglish
                </span>
              )}

              {/* Grounding Toggles */}
              <button
                type="button"
                onClick={onToggleSearch}
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] transition-colors border cursor-pointer ${
                  useSearch
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold'
                    : 'border-neutral-200 dark:border-neutral-800 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300'
                }`}
                title="Ground responses with Google Search"
              >
                <Search className="w-3 h-3" />
                <span>Search Grounding</span>
              </button>

              <button
                type="button"
                onClick={onToggleMaps}
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] transition-colors border cursor-pointer ${
                  useMaps
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold'
                    : 'border-neutral-200 dark:border-neutral-800 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300'
                }`}
                title="Ground location queries with Google Maps"
              >
                <MapPin className="w-3 h-3" />
                <span>Maps Grounding</span>
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-2 text-[11px] text-neutral-400">
              <span>Enter to send</span>
              <span aria-hidden="true">·</span>
              <span>Shift+Enter newline</span>
            </div>
          </div>

          {/* Recording Status Banner */}
          {isRecording && (
            <div className="mb-2 px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
                <span>Recording voice (Tamil/English)... {recordingSeconds}s</span>
              </div>
              <button
                onClick={stopRecording}
                className="px-3 py-1 rounded-md bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700"
              >
                Done
              </button>
            </div>
          )}

          {isTranscribing && (
            <div className="mb-2 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs text-amber-700 dark:text-amber-300 flex items-center gap-2">
              <Radio className="w-3.5 h-3.5 animate-spin" />
              <span>Transcribing audio verbatim with Gemini 3.5...</span>
            </div>
          )}

          {/* Elevated Command Input Container */}
          <div className="relative flex items-end rounded-2xl border border-neutral-300 dark:border-neutral-700/90 bg-white dark:bg-neutral-900 shadow-sm focus-within:border-neutral-500 dark:focus-within:border-neutral-500 transition-all">
            {/* Microphone Audio Transcribe Button */}
            <div className="pl-2 pb-2">
              <button
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                className={`p-2 rounded-xl transition-colors cursor-pointer ${
                  isRecording
                    ? 'bg-rose-600 text-white animate-bounce'
                    : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
                title="Voice input · பேசுங்கள் (gemini-3.5-transcribe)"
              >
                {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            </div>

            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything in Tamil (தமிழ்), English, or Tanglish... (e.g. Enna panreenga?)"
              rows={1}
              className="w-full pl-2 pr-12 py-3.5 max-h-44 bg-transparent text-sm text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 resize-none focus:outline-none"
            />

            <div className="absolute right-2.5 bottom-2.5 flex items-center gap-1.5">
              {isStreaming ? (
                <button
                  type="button"
                  onClick={onStopStreaming}
                  className="p-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 transition-colors shadow-xs cursor-pointer"
                  title="Stop generation"
                >
                  <Square className="w-4 h-4 fill-current" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!inputText.trim()}
                  className={`p-2 rounded-xl transition-all shadow-xs ${
                    inputText.trim()
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 cursor-pointer'
                      : 'bg-neutral-100 text-neutral-300 dark:bg-neutral-800 dark:text-neutral-600 cursor-not-allowed'
                  }`}
                  title="Send message (Enter)"
                >
                  <Send className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-neutral-400 mt-2 px-1">
            <span>Powered by Gemini 3.1 Flash-Lite Engine</span>
            <span>Bilingual AI Studio Platform</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
