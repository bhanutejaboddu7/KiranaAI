import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import { chatWithData } from '../services/api';

import { useLocation } from 'react-router-dom';

const CustomerView = () => {
    const location = useLocation();
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [response, setResponse] = useState('');
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isAlwaysOn, setIsAlwaysOn] = useState(false);
    const [wakeLock, setWakeLock] = useState(null);

    // Ref to handle pause state without triggering re-renders or dependency loops
    const isPausedForSpeaking = useRef(false);
    const recognitionRef = useRef(null);
    const isRecognitionActive = useRef(false); // Track actual state
    const isMounted = useRef(true);
    const processedQueryRef = useRef(null);
    const retryCountRef = useRef(0); // Track retries for backoff
    const restartDelayRef = useRef(500); // Dynamic restart delay

    // Speech Recognition Setup
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    // Handle Auto-Query from Deep Link
    useEffect(() => {
        if (location.state?.autoQuery && location.state.autoQuery !== processedQueryRef.current) {
            const query = location.state.autoQuery;
            console.log("Processing auto-query:", query);
            processedQueryRef.current = query;
            setTranscript(query);
            handleVoiceQuery(query);
        }
    }, [location.state]);

    const startRecognition = () => {
        if (!recognitionRef.current || !isMounted.current) return;

        if (isRecognitionActive.current) {
            console.log("Recognition already active, skipping start");
            return;
        }

        try {
            recognitionRef.current.start();
            isRecognitionActive.current = true;
            setIsListening(true);
            // We don't reset retryCount here immediately, we do it on 'onstart'
        } catch (e) {
            console.error("Failed to start recognition:", e);
            // If it says already started, we sync our state
            if (e.name === 'InvalidStateError') {
                isRecognitionActive.current = true;
                setIsListening(true);
            }
        }
    };

    const stopRecognition = () => {
        if (!recognitionRef.current) return;
        try {
            recognitionRef.current.stop();
        } catch (e) {
            console.error("Failed to stop recognition:", e);
        }
    };

    const abortRecognition = () => {
        if (!recognitionRef.current) return;
        try {
            recognitionRef.current.abort();
            isRecognitionActive.current = false;
            setIsListening(false);
        } catch (e) {
            console.error("Failed to abort recognition:", e);
        }
    };

    useEffect(() => {
        isMounted.current = true;
        if (!SpeechRecognition) return;

        // Create a fresh instance every time we mount or isAlwaysOn changes
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;

        recognition.continuous = isAlwaysOn;
        recognition.lang = 'en-IN';
        recognition.interimResults = false;

        recognition.onstart = () => {
            if (isMounted.current) {
                console.log("Recognition started");
                isRecognitionActive.current = true;
                setIsListening(true);
                retryCountRef.current = 0; // Reset retry count on successful start
                restartDelayRef.current = 500; // Reset delay
            }
        };

        recognition.onresult = (event) => {
            if (!isMounted.current) return;
            const results = event.results;
            const text = results[results.length - 1][0].transcript;
            console.log("Recognized:", text);
            handleVoiceQuery(text);
        };

        recognition.onend = () => {
            if (!isMounted.current) return;

            isRecognitionActive.current = false;
            console.log("Recognition ended");

            if (document.hidden) return; // Don't auto-restart if tab is hidden

            // Only auto-restart if we are NOT paused for speaking
            if (isAlwaysOn && !isPausedForSpeaking.current) {
                console.log(`Restarting recognition in ${restartDelayRef.current}ms...`);

                setTimeout(() => {
                    if (isMounted.current && !isRecognitionActive.current && !isPausedForSpeaking.current) {
                        startRecognition();
                    }
                }, restartDelayRef.current);
            } else if (!isAlwaysOn) {
                setIsListening(false);
            }
        };

        recognition.onerror = (event) => {
            if (!isMounted.current) return;

            // If error occurs, it usually means it stopped or will stop.
            // We DO NOT restart here. We let onend handle it.

            console.error("Speech recognition error", event.error);

            if (event.error === 'network') {
                retryCountRef.current += 1;
                // Exponential backoff: 1s, 2s, 4s... max 10s
                restartDelayRef.current = Math.min(1000 * Math.pow(2, retryCountRef.current), 10000);
                console.log(`Network error detected. Setting backoff delay to ${restartDelayRef.current}ms`);
            } else if (event.error === 'no-speech') {
                restartDelayRef.current = 500; // Standard delay
            } else if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                // Fatal errors, stop everything
                setIsAlwaysOn(false);
                setIsListening(false);
                restartDelayRef.current = 999999; // Prevent restart effectively
            } else {
                restartDelayRef.current = 1000; // Default error delay
            }
        };

        // Auto-start if Always On is enabled
        if (isAlwaysOn) {
            setTimeout(() => {
                if (isMounted.current && !document.hidden && !isRecognitionActive.current) {
                    startRecognition();
                }
            }, 500);
        }

        return () => {
            isMounted.current = false;
            abortRecognition();
        };
    }, [isAlwaysOn]);

    // Handle Browser Tab Switching (Visibility Change)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) {
                console.log("Tab hidden: Disabling Always On Mode");
                setIsAlwaysOn(false);
                abortRecognition();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, []);

    // Wake Lock Logic
    useEffect(() => {
        const requestWakeLock = async () => {
            if ('wakeLock' in navigator && isAlwaysOn) {
                try {
                    const lock = await navigator.wakeLock.request('screen');
                    setWakeLock(lock);
                    console.log('Wake Lock active');
                } catch (err) {
                    console.error(`${err.name}, ${err.message}`);
                }
            }
        };

        const releaseWakeLock = async () => {
            if (wakeLock) {
                await wakeLock.release();
                setWakeLock(null);
                console.log('Wake Lock released');
            }
        };

        if (isAlwaysOn) {
            requestWakeLock();
        } else {
            releaseWakeLock();
        }

        return () => releaseWakeLock();
    }, [isAlwaysOn]);

    const toggleListening = () => {
        if (!SpeechRecognition) {
            alert("Voice recognition not supported in this browser.");
            return;
        }

        if (isListening) {
            stopRecognition();
            setIsAlwaysOn(false);
            setIsListening(false);
        } else {
            startRecognition();
            setTranscript("Listening...");
        }
    };

    const toggleAlwaysOn = () => {
        if (!SpeechRecognition) return;

        const newState = !isAlwaysOn;
        setIsAlwaysOn(newState);
        isPausedForSpeaking.current = false; // Reset pause state
        retryCountRef.current = 0;
        restartDelayRef.current = 500;

        if (!newState) {
            stopRecognition();
        }
    };

    const handleVoiceQuery = async (text) => {
        if (isAlwaysOn) {
            const wakeWord = "kirana";
            const lowerText = text.toLowerCase();

            if (!lowerText.includes(wakeWord)) {
                console.log("Ignored (No wake word):", text);
                return;
            }
            setTranscript(text);
        } else {
            setTranscript(text);
        }

        try {
            const res = await chatWithData(text);
            setResponse(res.response);
            speakResponse(res.response);
        } catch (error) {
            console.error("Error processing voice query:", error);
            setResponse("Sorry, I couldn't understand that.");
        }
    };

    const speakResponse = (text) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            setIsSpeaking(true);

            if (isAlwaysOn && isRecognitionActive.current) {
                isPausedForSpeaking.current = true;
                stopRecognition();
                console.log("Paused recognition for speech");
            }

            utterance.onend = () => {
                setIsSpeaking(false);
                if (isAlwaysOn) {
                    console.log("Resuming recognition after speech");
                    isPausedForSpeaking.current = false;
                    setTimeout(() => {
                        if (isMounted.current && !isRecognitionActive.current) {
                            startRecognition();
                        }
                    }, 200);
                }
            };

            window.speechSynthesis.speak(utterance);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] p-4 text-center space-y-8">
            <h1 className="text-3xl font-bold text-gray-800">Customer Assistant</h1>

            {/* Always On Toggle */}
            <div className="flex items-center gap-3 bg-white p-3 rounded-full shadow-sm border border-gray-200">
                <span className="text-sm font-medium text-gray-600">Always On Mode</span>
                <button
                    onClick={toggleAlwaysOn}
                    className={`w-12 h-6 rounded-full transition-colors relative ${isAlwaysOn ? 'bg-green-500' : 'bg-gray-300'}`}
                >
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${isAlwaysOn ? 'left-7' : 'left-1'}`} />
                </button>
            </div>

            <div className="relative">
                <button
                    onClick={toggleListening}
                    className={`w-32 h-32 rounded-full flex items-center justify-center shadow-lg transition-all ${isListening
                        ? isAlwaysOn ? 'bg-green-500 animate-pulse ring-4 ring-green-200' : 'bg-red-500 animate-pulse'
                        : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                >
                    {isListening ? <MicOff size={48} className="text-white" /> : <Mic size={48} className="text-white" />}
                </button>
                {isListening && (
                    <p className="mt-4 text-gray-600 font-medium">
                        {isAlwaysOn ? "Always Listening..." : "Listening..."}
                    </p>
                )}
            </div>

            {transcript && (
                <div className="bg-gray-100 p-4 rounded-lg max-w-md w-full">
                    <p className="text-sm text-gray-500 mb-1">You said:</p>
                    <p className="text-lg font-medium text-gray-800">"{transcript}"</p>
                </div>
            )}

            {response && (
                <div className="bg-green-50 border border-green-200 p-6 rounded-lg max-w-md w-full shadow-sm">
                    <div className="flex items-center justify-center gap-2 mb-2 text-green-700">
                        <Volume2 size={24} className={isSpeaking ? 'animate-bounce' : ''} />
                        <span className="font-bold">Assistant</span>
                    </div>
                    <div className="prose prose-sm max-w-none text-left">
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeHighlight]}
                            components={{
                                table: ({ node, ...props }) => (
                                    <div className="overflow-x-auto my-4 rounded-lg border border-green-200 shadow-sm bg-white">
                                        <table className="min-w-full divide-y divide-green-100" {...props} />
                                    </div>
                                ),
                                thead: ({ node, ...props }) => (
                                    <thead className="bg-green-100" {...props} />
                                ),
                                th: ({ node, ...props }) => (
                                    <th className="px-4 py-3 text-left text-xs font-medium text-green-800 uppercase tracking-wider" {...props} />
                                ),
                                tbody: ({ node, ...props }) => (
                                    <tbody className="bg-white divide-y divide-green-50" {...props} />
                                ),
                                tr: ({ node, ...props }) => (
                                    <tr className="hover:bg-green-50 transition-colors" {...props} />
                                ),
                                td: ({ node, ...props }) => (
                                    <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap" {...props} />
                                ),
                            }}
                        >
                            {response}
                        </ReactMarkdown>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomerView;
