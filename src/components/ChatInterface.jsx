import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import { Send, Bot, User, Loader2, Mic, X, Radio, Sparkles } from 'lucide-react';
import { chatWithData, sendVoiceMessage } from '../services/api';
import { cn } from '../lib/utils';

const ChatInterface = ({ messages, setMessages }) => {
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isLiveMode, setIsLiveMode] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const messagesEndRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    const handleSend = async (e) => {
        if (e) e.preventDefault();
        if (!input.trim()) return;

        const userMessage = input;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsLoading(true);

        try {
            const history = messages.slice(1).map(msg => ({
                role: msg.role,
                content: msg.content
            }));

            const data = await chatWithData(userMessage, history);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: data.response,
                sql: data.sql_query
            }]);

        } catch (error) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: "Sorry, I encountered an error processing your request."
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                setIsProcessing(true);
                try {
                    const data = await sendVoiceMessage(audioBlob);

                    const audio = new Audio(`data:audio/mp3;base64,${data.audio_base64}`);
                    audio.play();

                    setMessages(prev => [...prev,
                    { role: 'assistant', content: data.text_response }
                    ]);
                } catch (error) {
                    console.error("Error processing voice:", error);
                    setMessages(prev => [...prev, {
                        role: 'assistant',
                        content: "Sorry, I couldn't process your voice message."
                    }]);
                } finally {
                    setIsProcessing(false);
                }

                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Error accessing microphone:", err);
            alert("Could not access microphone. Please ensure permissions are granted.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const toggleRecording = () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    return (
        <div className="flex flex-col h-[calc(100dvh-4rem)] md:h-[calc(100vh-8rem)] bg-slate-50 dark:bg-slate-900 md:rounded-2xl md:shadow-xl md:border border-slate-200 dark:border-slate-800 overflow-hidden relative font-sans">

            {/* Header - Mobile Only */}
            <div className="md:hidden absolute top-0 left-0 right-0 h-14 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 z-10 flex items-center px-4 justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-lg">
                        <Bot size={18} />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 dark:text-white text-sm">Kirana Assistant</h3>
                        <p className="text-xs text-green-500 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Online
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setIsLiveMode(true)}
                    className="p-2 bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 rounded-full hover:bg-indigo-100 transition-colors"
                >
                    <Mic size={20} />
                </button>
            </div>

            {/* Live Mode Overlay */}
            {isLiveMode && (
                <div className="absolute inset-0 z-50 bg-slate-900/95 backdrop-blur-md flex flex-col items-center justify-center p-6 transition-all duration-300 animate-in fade-in zoom-in-95">
                    <button
                        onClick={() => setIsLiveMode(false)}
                        className="absolute top-6 right-6 p-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
                    >
                        <X size={24} />
                    </button>

                    <div className="flex flex-col items-center gap-12 max-w-md w-full text-center">
                        <div className="space-y-4">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 text-sm font-medium animate-pulse">
                                <Radio size={14} /> Live Voice Mode
                            </div>
                            <h2 className="text-3xl font-bold text-white tracking-tight">
                                How can I help you?
                            </h2>
                            <p className="text-slate-400 text-lg">Tap to speak with your assistant</p>
                        </div>

                        <div className="relative group">
                            <div className={cn(
                                "absolute inset-0 bg-indigo-500 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-500",
                                isRecording && "animate-pulse opacity-50"
                            )} />
                            <button
                                onClick={toggleRecording}
                                disabled={isProcessing}
                                className={cn(
                                    "relative w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl border-4",
                                    isRecording
                                        ? "bg-red-500 text-white border-red-400 scale-110 shadow-red-500/50"
                                        : "bg-gradient-to-br from-indigo-600 to-purple-600 text-white border-indigo-400/30 hover:scale-105 shadow-indigo-500/50",
                                    isProcessing && "opacity-80 cursor-not-allowed"
                                )}
                            >
                                {isProcessing ? (
                                    <Loader2 size={48} className="animate-spin" />
                                ) : (
                                    <Mic size={48} className={cn(isRecording && "animate-bounce")} />
                                )}
                            </button>
                        </div>

                        <div className="h-16 flex items-center justify-center w-full">
                            {isRecording ? (
                                <div className="flex gap-1.5 items-center h-12">
                                    {[...Array(7)].map((_, i) => (
                                        <div
                                            key={i}
                                            className="w-1.5 bg-gradient-to-t from-red-500 to-pink-500 rounded-full animate-music-bar"
                                            style={{
                                                height: '30%',
                                                animationDelay: `${i * 0.1}s`
                                            }}
                                        />
                                    ))}
                                </div>
                            ) : isProcessing ? (
                                <span className="text-indigo-300 font-medium animate-pulse flex items-center gap-2">
                                    <Sparkles size={16} /> Processing voice...
                                </span>
                            ) : (
                                <span className="text-slate-500 text-sm">Tap microphone to start</span>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 pt-20 md:pt-4 space-y-6 scroll-smooth">
                {messages.map((msg, index) => (
                    <div
                        key={index}
                        className={cn(
                            "flex gap-4 max-w-[90%] md:max-w-[80%] animate-in slide-in-from-bottom-2 duration-300",
                            msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
                        )}
                    >
                        <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-lg border-2 border-white dark:border-slate-700",
                            msg.role === 'user'
                                ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white"
                                : "bg-gradient-to-br from-indigo-500 to-purple-500 text-white"
                        )}>
                            {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
                        </div>

                        <div className={cn(
                            "p-4 rounded-2xl text-[15px] shadow-sm leading-relaxed",
                            msg.role === 'user'
                                ? "bg-blue-600 text-white rounded-tr-none shadow-blue-500/20"
                                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-tl-none border border-slate-100 dark:border-slate-700 shadow-slate-200/50 dark:shadow-none"
                        )}>
                            <div className="prose prose-sm prose-invert max-w-none">
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    rehypePlugins={[rehypeHighlight]}
                                    components={{
                                        table: ({ node, ...props }) => (
                                            <div className="overflow-x-auto my-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 shadow-inner">
                                                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700" {...props} />
                                            </div>
                                        ),
                                        thead: ({ node, ...props }) => <thead className="bg-slate-100 dark:bg-slate-800" {...props} />,
                                        th: ({ node, ...props }) => <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider" {...props} />,
                                        tbody: ({ node, ...props }) => <tbody className="divide-y divide-slate-200 dark:divide-slate-700" {...props} />,
                                        tr: ({ node, ...props }) => <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors" {...props} />,
                                        td: ({ node, ...props }) => <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap" {...props} />,
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
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white flex items-center justify-center shrink-0 shadow-lg">
                            <Bot size={20} />
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl rounded-tl-none border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-3">
                            <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                            <span className="text-sm text-slate-500">Thinking...</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} className="h-4" />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 sticky bottom-0 z-20 pb-safe">
                <form onSubmit={handleSend} className="flex gap-3 items-center max-w-4xl mx-auto">
                    <button
                        type="button"
                        onClick={() => setIsLiveMode(true)}
                        className="p-3 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 rounded-xl transition-all duration-200 active:scale-95 hidden md:flex"
                        title="Live Mode"
                    >
                        <Mic size={22} />
                    </button>
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask about inventory, sales, or prices..."
                            className="w-full pl-5 pr-12 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-sm"
                            disabled={isLoading}
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !input.trim()}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg active:scale-95"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </form>
            </div>

            <style jsx>{`
                .pb-safe {
                    padding-bottom: env(safe-area-inset-bottom, 1rem);
                }
                @keyframes music-bar {
                    0%, 100% { height: 30%; }
                    50% { height: 100%; }
                }
                .animate-music-bar {
                    animation: music-bar 0.5s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
};

export default ChatInterface;
