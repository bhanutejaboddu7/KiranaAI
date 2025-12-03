import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import { Send, Bot, User, Loader2, Mic, X, Volume2, Radio } from 'lucide-react';
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

                    // Play audio
                    const audio = new Audio(`data:audio/mp3;base64,${data.audio_base64}`);
                    audio.play();

                    // Update chat history
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

                // Stop all tracks
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
        <div className="flex flex-col h-[calc(100vh-8rem)] bg-slate-900 rounded-xl shadow-sm border border-slate-700 overflow-hidden relative">

            {/* Live Mode Overlay */}
            {isLiveMode && (
                <div className="absolute inset-0 z-50 bg-slate-900/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 transition-all duration-300">
                    <button
                        onClick={() => setIsLiveMode(false)}
                        className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
                    >
                        <X size={24} />
                    </button>

                    <div className="flex flex-col items-center gap-8 max-w-md w-full text-center">
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold text-white flex items-center justify-center gap-2">
                                <Radio className="text-red-500 animate-pulse" />
                                Live Mode
                            </h2>
                            <p className="text-slate-400">Tap the microphone to speak</p>
                        </div>

                        <button
                            onClick={toggleRecording}
                            disabled={isProcessing}
                            className={cn(
                                "w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl",
                                isRecording
                                    ? "bg-red-500/20 text-red-500 ring-4 ring-red-500/50 scale-110"
                                    : "bg-blue-600 text-white hover:bg-blue-500 hover:scale-105 shadow-blue-500/20",
                                isProcessing && "opacity-50 cursor-not-allowed animate-pulse"
                            )}
                        >
                            {isProcessing ? (
                                <Loader2 size={48} className="animate-spin" />
                            ) : (
                                <Mic size={48} className={cn(isRecording && "animate-bounce")} />
                            )}
                        </button>

                        <div className="h-12 flex items-center justify-center">
                            {isRecording && (
                                <div className="flex gap-1 items-end h-8">
                                    {[...Array(5)].map((_, i) => (
                                        <div
                                            key={i}
                                            className="w-1 bg-red-500 rounded-full animate-music-bar"
                                            style={{
                                                height: '100%',
                                                animationDelay: `${i * 0.1}s`
                                            }}
                                        />
                                    ))}
                                </div>
                            )}
                            {isProcessing && (
                                <span className="text-blue-400 font-medium animate-pulse">Processing...</span>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, index) => (
                    <div
                        key={index}
                        className={cn(
                            "flex gap-3 max-w-[85%]",
                            msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
                        )}
                    >
                        <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-md",
                            msg.role === 'user' ? "bg-blue-600 text-white" : "bg-slate-700 text-blue-300"
                        )}>
                            {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                        </div>

                        <div className={cn(
                            "p-3 rounded-2xl text-sm shadow-md",
                            msg.role === 'user'
                                ? "bg-blue-600 text-white rounded-tr-none"
                                : "bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700"
                        )}>
                            <div className="prose prose-sm prose-invert max-w-none">
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    rehypePlugins={[rehypeHighlight]}
                                    components={{
                                        table: ({ node, ...props }) => (
                                            <div className="overflow-x-auto my-2 rounded border border-slate-600 bg-slate-900/50">
                                                <table className="min-w-full divide-y divide-slate-700" {...props} />
                                            </div>
                                        ),
                                        thead: ({ node, ...props }) => <thead className="bg-slate-800" {...props} />,
                                        th: ({ node, ...props }) => <th className="px-3 py-2 text-left text-xs font-medium text-slate-300 uppercase" {...props} />,
                                        tbody: ({ node, ...props }) => <tbody className="divide-y divide-slate-700" {...props} />,
                                        tr: ({ node, ...props }) => <tr className="hover:bg-slate-800/50" {...props} />,
                                        td: ({ node, ...props }) => <td className="px-3 py-2 text-sm text-slate-300" {...props} />,
                                    }}
                                >
                                    {msg.content}
                                </ReactMarkdown>
                            </div>
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-700 text-blue-300 flex items-center justify-center shrink-0">
                            <Bot size={16} />
                        </div>
                        <div className="bg-slate-800 p-3 rounded-2xl rounded-tl-none border border-slate-700">
                            <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-slate-700 bg-slate-800">
                <form onSubmit={handleSend} className="flex gap-2 items-center">
                    <button
                        type="button"
                        onClick={() => setIsLiveMode(true)}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                        title="Live Mode"
                    >
                        <Mic size={20} />
                    </button>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask about your inventory or sales..."
                        className="flex-1 px-4 py-2 rounded-lg border border-slate-600 bg-slate-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg"
                    >
                        <Send size={20} />
                    </button>
                </form>
            </div>

            <style jsx>{`
                @keyframes music-bar {
                    0%, 100% { height: 20%; }
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
