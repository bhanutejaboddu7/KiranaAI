import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import { Send, Bot, User, Loader2, Mic, X, Radio, Sparkles, Volume2 } from 'lucide-react';
import { chatWithData, getTTS } from '../services/api';
import { cn } from '../lib/utils';
import { SpeechRecognition } from '@capacitor-community/speech-recognition';
import { Capacitor } from '@capacitor/core';
import { useTranslation } from 'react-i18next';

const ChatInterface = ({ messages, setMessages }) => {
    const { t, i18n } = useTranslation();
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);

    const messagesEndRef = useRef(null);
    const recognitionRef = useRef(null);
    const audioRef = useRef(new Audio());

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    // Initialize Web Speech API for browser
    useEffect(() => {
        if (!Capacitor.isNativePlatform() && 'webkitSpeechRecognition' in window) {
            const recognition = new window.webkitSpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = true;
            recognition.lang = i18n.language === 'hi' ? 'hi-IN' : 'en-US'; // Basic mapping

            recognition.onstart = () => setIsListening(true);
            recognition.onend = () => setIsListening(false);

            recognition.onresult = (event) => {
                const transcript = Array.from(event.results)
                    .map(result => result[0].transcript)
                    .join('');
                setInput(transcript);

                // Auto-send if final result
                if (event.results[0].isFinal) {
                    handleSend(null, transcript);
                }
            };

            recognitionRef.current = recognition;
        }
    }, [i18n.language]);

    const handleSend = async (e, textOverride = null) => {
        if (e) e.preventDefault();
        const textToSend = textOverride || input;

        if (!textToSend.trim()) return;

        // Stop listening if active
        if (isListening) {
            stopListening();
        }

        // Stop any current audio
        if (isSpeaking) {
            audioRef.current.pause();
            setIsSpeaking(false);
        }

        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: textToSend }]);
        setIsLoading(true);

        try {
            const history = messages.slice(1).map(msg => ({
                role: msg.role,
                content: msg.content
            }));

            // 1. Get Text Response
            const data = await chatWithData(textToSend, history, i18n.language);
            const responseText = data.response;

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: responseText,
                sql: data.sql_query
            }]);

            // 2. Play Audio Response (TTS)
            playTTS(responseText);

        } catch (error) {
            console.error("Chat error:", error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: t('error_processing_request')
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const playTTS = async (text) => {
        try {
            setIsSpeaking(true);
            const audioBlob = await getTTS(text, i18n.language);
            const audioUrl = URL.createObjectURL(audioBlob);

            audioRef.current.src = audioUrl;
            audioRef.current.onended = () => {
                setIsSpeaking(false);
                URL.revokeObjectURL(audioUrl);
            };
            audioRef.current.play();
        } catch (error) {
            console.error("TTS Error:", error);
            setIsSpeaking(false);
        }
    };

    const startListening = async () => {
        if (Capacitor.isNativePlatform()) {
            // Native implementation
            try {
                const { available } = await SpeechRecognition.available();
                if (available) {
                    setIsListening(true);
                    SpeechRecognition.start({
                        language: i18n.language === 'hi' ? 'hi-IN' : 'en-US',
                        partialResults: true,
                        popup: false,
                    });

                    SpeechRecognition.addListener('partialResults', (data) => {
                        if (data.matches && data.matches.length > 0) {
                            setInput(data.matches[0]);
                        }
                    });
                }
            } catch (e) {
                console.error("Native speech error:", e);
                setIsListening(false);
            }
        } else {
            // Browser implementation
            recognitionRef.current?.start();
        }
    };

    const stopListening = async () => {
        if (Capacitor.isNativePlatform()) {
            await SpeechRecognition.stop();
            setIsListening(false);
        } else {
            recognitionRef.current?.stop();
        }
    };

    const toggleListening = () => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    };

    return (
        <div className="flex flex-col h-full bg-background md:rounded-2xl md:shadow-xl md:border border-border overflow-hidden relative font-sans">

            {/* Header */}
            <div className="absolute top-0 left-0 right-0 pt-safe h-[calc(3.5rem+env(safe-area-inset-top))] bg-background/80 backdrop-blur-md border-b border-border z-10 flex items-center px-4 justify-between transition-all duration-300">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-purple-600 flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
                        <Bot size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-foreground text-sm">Kirana Assistant</h3>
                        <p className="text-[10px] font-medium text-green-500 flex items-center gap-1.5 bg-green-500/10 px-2 py-0.5 rounded-full w-fit">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> {t('online')}
                        </p>
                    </div>
                </div>
                {isSpeaking && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full animate-pulse">
                        <Volume2 size={14} className="text-primary" />
                        <span className="text-xs font-medium text-primary">{t('speaking')}...</span>
                    </div>
                )}
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 pt-[calc(4rem+env(safe-area-inset-top))] space-y-6 scroll-smooth no-scrollbar">
                {messages.map((msg, index) => (
                    <div
                        key={index}
                        className={cn(
                            "flex gap-3 max-w-[90%] md:max-w-[80%] animate-in slide-in-from-bottom-2 duration-300",
                            msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
                        )}
                    >
                        <div className={cn(
                            "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-border",
                            msg.role === 'user'
                                ? "bg-primary text-primary-foreground"
                                : "bg-card text-foreground"
                        )}>
                            {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                        </div>

                        <div className={cn(
                            "p-3.5 rounded-2xl text-[15px] shadow-sm leading-relaxed",
                            msg.role === 'user'
                                ? "bg-primary text-primary-foreground rounded-tr-sm"
                                : "bg-card text-card-foreground rounded-tl-sm border border-border"
                        )}>
                            <div className="prose prose-sm prose-invert max-w-none">
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    rehypePlugins={[rehypeHighlight]}
                                    components={{
                                        // ... (Keep existing markdown components)
                                        table: ({ node, ...props }) => (
                                            <div className="overflow-x-auto my-3 rounded-lg border border-border bg-muted/50 shadow-inner">
                                                <table className="min-w-full divide-y divide-border" {...props} />
                                            </div>
                                        ),
                                        thead: ({ node, ...props }) => <thead className="bg-muted" {...props} />,
                                        th: ({ node, ...props }) => <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider" {...props} />,
                                        tbody: ({ node, ...props }) => <tbody className="divide-y divide-border" {...props} />,
                                        tr: ({ node, ...props }) => <tr className="hover:bg-muted/50 transition-colors" {...props} />,
                                        td: ({ node, ...props }) => <td className="px-4 py-3 text-sm text-foreground whitespace-nowrap" {...props} />,
                                        p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                                        ul: ({ node, ...props }) => <ul className="list-disc pl-4 mb-2 space-y-1" {...props} />,
                                        ol: ({ node, ...props }) => <ol className="list-decimal pl-4 mb-2 space-y-1" {...props} />,
                                    }}
                                >
                                    {msg.content}
                                </ReactMarkdown>
                            </div>
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex gap-4 animate-in fade-in duration-300">
                        <div className="w-8 h-8 rounded-xl bg-card text-foreground flex items-center justify-center shrink-0 shadow-sm border border-border">
                            <Bot size={16} />
                        </div>
                        <div className="bg-card p-4 rounded-2xl rounded-tl-sm border border-border shadow-sm flex items-center gap-3">
                            <Loader2 className="w-4 h-4 animate-spin text-primary" />
                            <span className="text-sm text-muted-foreground">{t('thinking')}</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} className="h-4" />
            </div>

            {/* Input Area */}
            <div className="p-3 bg-background/80 backdrop-blur-xl border-t border-border sticky bottom-0 z-20 pb-[calc(env(safe-area-inset-bottom,0px)+0.5rem)] md:pb-4">
                <form onSubmit={(e) => handleSend(e)} className="flex gap-2 items-end max-w-4xl mx-auto">
                    <div className="flex-1 relative bg-muted/50 rounded-2xl border border-transparent focus-within:border-primary/50 focus-within:bg-background transition-all duration-200 flex items-center">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={isListening ? t('listening') + "..." : t('ask_anything')}
                            className="w-full pl-4 pr-12 py-3.5 bg-transparent text-foreground placeholder-muted-foreground focus:outline-none rounded-2xl"
                            disabled={isLoading}
                        />

                        {/* Mic Button inside Input */}
                        <button
                            type="button"
                            onClick={toggleListening}
                            className={cn(
                                "absolute right-1.5 p-2 rounded-xl transition-all active:scale-95",
                                isListening
                                    ? "bg-red-500 text-white animate-pulse"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                        >
                            {isListening ? <X size={18} /> : <Mic size={18} />}
                        </button>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="p-3.5 bg-primary text-primary-foreground rounded-2xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95"
                    >
                        <Send size={20} />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChatInterface;
