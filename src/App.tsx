import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { InfoModal } from './components/InfoModal';
import { ThreeGameModal } from './components/ThreeGameModal';
import { ImageGenModal } from './components/ImageGenModal';
import { GoogleMapsViewModal } from './components/GoogleMapsViewModal';
import { LiveVoiceModal } from './components/LiveVoiceModal';
import { MusicGenModal } from './components/MusicGenModal';
import { VideoGenModal } from './components/VideoGenModal';
import { ChatSession, ChatMessage, LanguageType } from './types';
import { detectLanguageClient } from './utils/language';

const STORAGE_KEY = 'namma_ai_chat_sessions_v1';
const THEME_KEY = 'namma_ai_theme_v1';

export default function App() {
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load sessions from storage:', e);
    }
    return [];
  });

  const [activeSessionId, setActiveSessionId] = useState<string | null>(() => {
    return sessions.length > 0 ? sessions[0].id : null;
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isGameOpen, setIsGameOpen] = useState(false);
  const [isImageStudioOpen, setIsImageStudioOpen] = useState(false);
  const [isMapsOpen, setIsMapsOpen] = useState(false);
  const [isLiveVoiceOpen, setIsLiveVoiceOpen] = useState(false);
  const [isMusicOpen, setIsMusicOpen] = useState(false);
  const [isVideoOpen, setIsVideoOpen] = useState(false);

  // Speed and Grounding State
  const [modelMode, setModelMode] = useState<'turbo' | 'pro'>('turbo');
  const [useSearch, setUseSearch] = useState(false);
  const [useMaps, setUseMaps] = useState(false);
  const [mapsQuotaExceeded, setMapsQuotaExceeded] = useState(false);

  useEffect(() => {
    const handleQuota = () => setMapsQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handleQuota);
    return () => window.removeEventListener('gmp-quota-exceeded', handleQuota);
  }, []);

  // Theme management
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const savedTheme = localStorage.getItem(THEME_KEY);
      if (savedTheme) return savedTheme === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem(THEME_KEY, 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem(THEME_KEY, 'light');
    }
  }, [isDarkMode]);

  // Persist sessions
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    } catch (e) {
      console.error('Failed to save sessions to storage:', e);
    }
  }, [sessions]);

  // Streaming State
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [streamingLanguage, setStreamingLanguage] = useState<LanguageType | null>(null);
  const [streamingSources, setStreamingSources] = useState<any[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const activeSession = sessions.find((s) => s.id === activeSessionId) || null;

  const handleNewChat = () => {
    if (isStreaming) {
      handleStopStreaming();
    }
    const newSession: ChatSession = {
      id: 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      title: 'New Conversation',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
    };
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setErrorMessage(null);
    setStreamingContent('');
    setStreamingLanguage(null);
    setStreamingSources([]);
  };

  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (activeSessionId === id) {
      const remaining = sessions.filter((s) => s.id !== id);
      setActiveSessionId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  const handleRenameSession = (id: string, newTitle: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, title: newTitle, updatedAt: Date.now() } : s))
    );
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all chat history? / அனைத்து உரையாடல்களையும் நீக்க விரும்புகிறீர்களா?')) {
      if (isStreaming) handleStopStreaming();
      setSessions([]);
      setActiveSessionId(null);
      setErrorMessage(null);
    }
  };

  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);

    if (streamingContent && activeSessionId) {
      const assistantMessage: ChatMessage = {
        id: 'msg_asst_' + Date.now(),
        role: 'assistant',
        content: streamingContent,
        timestamp: Date.now(),
        detectedLanguage: streamingLanguage || 'english',
        sources: streamingSources,
      };

      setSessions((prev) =>
        prev.map((s) => {
          if (s.id === activeSessionId) {
            return {
              ...s,
              updatedAt: Date.now(),
              messages: [...s.messages, assistantMessage],
            };
          }
          return s;
        })
      );
    }
    setStreamingContent('');
    setStreamingSources([]);
  };

  const handleSendMessage = async (userText: string) => {
    if (!userText.trim() || isStreaming) return;
    setErrorMessage(null);

    const clientLang = detectLanguageClient(userText);
    const userMessage: ChatMessage = {
      id: 'msg_user_' + Date.now(),
      role: 'user',
      content: userText,
      timestamp: Date.now(),
      detectedLanguage: clientLang,
    };

    let targetSessionId = activeSessionId;
    let currentSessionMessages: ChatMessage[] = [];

    if (!targetSessionId || !activeSession) {
      const titleWords = userText.trim().split(/\s+/).slice(0, 5).join(' ');
      const newSessionTitle = titleWords.length > 30 ? titleWords.slice(0, 30) + '...' : titleWords;
      const newSession: ChatSession = {
        id: 'session_' + Date.now(),
        title: newSessionTitle || 'New Conversation',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [userMessage],
      };
      setSessions((prev) => [newSession, ...prev]);
      targetSessionId = newSession.id;
      setActiveSessionId(targetSessionId);
      currentSessionMessages = [userMessage];
    } else {
      currentSessionMessages = [...activeSession.messages, userMessage];

      const isFirstMessage = activeSession.messages.length === 0;
      let updatedTitle = activeSession.title;
      if (isFirstMessage) {
        const words = userText.trim().split(/\s+/).slice(0, 5).join(' ');
        updatedTitle = words.length > 30 ? words.slice(0, 30) + '...' : words;
      }

      setSessions((prev) =>
        prev.map((s) => {
          if (s.id === targetSessionId) {
            return {
              ...s,
              title: updatedTitle,
              updatedAt: Date.now(),
              messages: currentSessionMessages,
            };
          }
          return s;
        })
      );
    }

    setIsStreaming(true);
    setStreamingContent('');
    setStreamingLanguage(clientLang);
    setStreamingSources([]);

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortControllerRef.current.signal,
        body: JSON.stringify({
          messages: currentSessionMessages,
          userMessage: userText,
          mode: modelMode,
          useSearch: useSearch,
          useMaps: useMaps,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let accumulatedText = '';
      let detectedResponseLang: LanguageType = clientLang;
      let capturedSources: any[] = [];

      let buffer = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (trimmedLine.startsWith('data: ')) {
            const jsonStr = trimmedLine.replace('data: ', '').trim();
            if (!jsonStr) continue;

            try {
              const data = JSON.parse(jsonStr);
              if (data.type === 'start') {
                if (data.detectedLanguage) {
                  detectedResponseLang = data.detectedLanguage;
                  setStreamingLanguage(data.detectedLanguage);
                }
              } else if (data.type === 'chunk') {
                accumulatedText += data.text || '';
                setStreamingContent(accumulatedText);
              } else if (data.type === 'sources') {
                if (Array.isArray(data.sources)) {
                  capturedSources = data.sources;
                  setStreamingSources(data.sources);
                }
              } else if (data.type === 'error') {
                throw new Error(data.error || 'Server error generating response');
              }
            } catch (err) {
              console.warn('Could not parse SSE message:', jsonStr, err);
            }
          }
        }
      }

      const finalAssistantMessage: ChatMessage = {
        id: 'msg_asst_' + Date.now(),
        role: 'assistant',
        content: accumulatedText || 'மன்னிக்கவும், பதில் உருவாக்க முடியவில்லை.',
        timestamp: Date.now(),
        detectedLanguage: detectedResponseLang,
        sources: capturedSources,
      };

      setSessions((prev) =>
        prev.map((s) => {
          if (s.id === targetSessionId) {
            return {
              ...s,
              updatedAt: Date.now(),
              messages: [...s.messages, finalAssistantMessage],
            };
          }
          return s;
        })
      );
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('User aborted generation');
      } else {
        console.error('Streaming request error, attempting JSON fallback:', err);
        try {
          const fallbackRes = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messages: currentSessionMessages,
              userMessage: userText,
              mode: modelMode,
              useSearch: useSearch,
              useMaps: useMaps,
            }),
          });
          const fallbackData = await fallbackRes.json();
          if (fallbackData.text) {
            const finalAssistantMessage: ChatMessage = {
              id: 'msg_asst_' + Date.now(),
              role: 'assistant',
              content: fallbackData.text,
              timestamp: Date.now(),
              detectedLanguage: fallbackData.detectedLanguage || clientLang,
              sources: fallbackData.sources || [],
            };

            setSessions((prev) =>
              prev.map((s) => {
                if (s.id === targetSessionId) {
                  return {
                    ...s,
                    updatedAt: Date.now(),
                    messages: [...s.messages, finalAssistantMessage],
                  };
                }
                return s;
              })
            );
          } else {
            setErrorMessage(fallbackData.error || 'Failed to generate response.');
          }
        } catch (fallbackErr: any) {
          setErrorMessage(err?.message || 'Connection error. Please try again.');
        }
      }
    } finally {
      setIsStreaming(false);
      setStreamingContent('');
      setStreamingSources([]);
      abortControllerRef.current = null;
    }
  };

  const handleRegenerate = () => {
    if (!activeSession || activeSession.messages.length === 0) return;
    const lastUserMessage = [...activeSession.messages].reverse().find((m) => m.role === 'user');
    if (lastUserMessage) {
      handleSendMessage(lastUserMessage.content);
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 antialiased overflow-hidden select-text">
      {mapsQuotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm shrink-0">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}

      <div className="flex flex-1 w-full overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelectSession={(id) => setActiveSessionId(id)}
          onNewChat={handleNewChat}
          onDeleteSession={handleDeleteSession}
          onRenameSession={handleRenameSession}
          onClearAll={handleClearAll}
          isOpen={isSidebarOpen}
          onCloseMobile={() => setIsSidebarOpen(false)}
          isDarkMode={isDarkMode}
          onToggleTheme={() => setIsDarkMode(!isDarkMode)}
          onOpenInfo={() => setIsInfoOpen(true)}
        />

        {/* Main Chat Interface */}
        <ChatArea
          session={activeSession}
          isStreaming={isStreaming}
          streamingContent={streamingContent}
          streamingLanguage={streamingLanguage}
          streamingSources={streamingSources}
          errorMessage={errorMessage}
          modelMode={modelMode}
          onChangeModelMode={(m) => setModelMode(m)}
          useSearch={useSearch}
          onToggleSearch={() => {
            setUseSearch(!useSearch);
            if (!useSearch) setUseMaps(false); // Search and Maps are mutually exclusive tools in GenAI
          }}
          useMaps={useMaps}
          onToggleMaps={() => {
            setUseMaps(!useMaps);
            if (!useMaps) setUseSearch(false);
          }}
          onSendMessage={handleSendMessage}
          onStopStreaming={handleStopStreaming}
          onRegenerate={handleRegenerate}
          onNewChat={handleNewChat}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onOpenGame={() => setIsGameOpen(true)}
          onOpenImageStudio={() => setIsImageStudioOpen(true)}
          onOpenGoogleMaps={() => setIsMapsOpen(true)}
          onOpenLiveVoice={() => setIsLiveVoiceOpen(true)}
          onOpenMusicStudio={() => setIsMusicOpen(true)}
          onOpenVideoGen={() => setIsVideoOpen(true)}
          isDarkMode={isDarkMode}
          onToggleTheme={() => setIsDarkMode(!isDarkMode)}
        />
      </div>

      {/* Google Maps Platform Modal */}
      <GoogleMapsViewModal isOpen={isMapsOpen} onClose={() => setIsMapsOpen(false)} />

      {/* Live Voice Conversation Modal (gemini-3.8-live) */}
      <LiveVoiceModal
        isOpen={isLiveVoiceOpen}
        onClose={() => setIsLiveVoiceOpen(false)}
        onTranscriptReceived={(u, a) => {
          handleSendMessage(u);
        }}
      />

      {/* 3D Three.js Game Modal */}
      <ThreeGameModal isOpen={isGameOpen} onClose={() => setIsGameOpen(false)} />

      {/* AI Image Generation Studio Modal */}
      <ImageGenModal
        isOpen={isImageStudioOpen}
        onClose={() => setIsImageStudioOpen(false)}
        onInsertIntoChat={(md) => handleSendMessage(md)}
      />

      {/* Music Studio Modal (Lyria / Tamil Melodies) */}
      <MusicGenModal
        isOpen={isMusicOpen}
        onClose={() => setIsMusicOpen(false)}
        onInsertIntoChat={(md) => handleSendMessage(md)}
      />

      {/* Video & Animation Modal (gemini-omni-1.2-flash) */}
      <VideoGenModal
        isOpen={isVideoOpen}
        onClose={() => setIsVideoOpen(false)}
        onInsertIntoChat={(md) => handleSendMessage(md)}
      />

      {/* About & Instructions Modal */}
      <InfoModal isOpen={isInfoOpen} onClose={() => setIsInfoOpen(false)} />
    </div>
  );
}
