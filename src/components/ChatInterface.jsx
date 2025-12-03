import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { chatWithData } from '../services/api';
import { cn } from '../lib/utils';

const ChatInterface = ({ messages, setMessages }) => {
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const messagesEndRef = useRef(null);

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
            // Format history for API (exclude the new message we just added locally AND the initial greeting)
            // Assuming the first message is always the static greeting
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

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)] bg-slate-900 rounded-xl shadow-sm border border-slate-700 overflow-hidden" >
            {/* Messages Area */}
            < div className="flex-1 overflow-y-auto p-4 space-y-4" >
                {
                    messages.map((msg, index) => (
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
                            )}
                            >
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
                    ))
                }
                {isLoading && (
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-700 text-blue-300 flex items-center justify-center shrink-0">
                            <Bot size={16} />
                        </div>
                        <div className="bg-slate-800 p-3 rounded-2xl rounded-tl-none border border-slate-700">
                            <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                        </div>
                    </div>
                )
                }
                <div ref={messagesEndRef} />
            </div >

            {/* Input Area */}
            < div className="p-4 border-t border-slate-700 bg-slate-800" >
                <form onSubmit={handleSend} className="flex gap-2 items-center">
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
            </div >
        </div >
    );
};

export default ChatInterface;
