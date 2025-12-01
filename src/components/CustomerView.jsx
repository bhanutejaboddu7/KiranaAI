import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, Loader2 } from 'lucide-react';
import { chatWithData } from '../services/api';
import { useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';
import { SpeechRecognition } from '@capacitor-community/speech-recognition';

const CustomerView = () => {
    const location = useLocation();
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [response, setResponse] = useState("Tap the microphone to start speaking...");
    const [isLoading, setIsLoading] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [hasPermission, setHasPermission] = useState(false);

    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;

        // Check permissions on mount
        SpeechRecognition.checkPermissions().then((result) => {
            if (result.speechRecognition === 'granted') {
                setHasPermission(true);
            } else {
                SpeechRecognition.requestPermissions().then((res) => {
                    if (res.speechRecognition === 'granted') setHasPermission(true);
                });
            }
        });

        return () => {
            isMounted.current = false;
            SpeechRecognition.stop();
            if (window.speechSynthesis) {
                window.speechSynthesis.cancel();
            }
        };
    }, []);

    // Handle Auto-Query from Deep Link
    useEffect(() => {
        if (location.state?.autoQuery) {
            setTranscript(location.state.autoQuery);
            handleSend(location.state.autoQuery);
        }
    }, [location.state]);

    const toggleListening = async () => {
        if (!hasPermission) {
            const res = await SpeechRecognition.requestPermissions();
            if (res.speechRecognition !== 'granted') {
                alert("Microphone permission is required.");
                return;
            }
            setHasPermission(true);
        }

        if (isListening) {
            await SpeechRecognition.stop();
            setIsListening(false);
        } else {
            setTranscript('');
            setResponse("Listening...");
            setIsListening(true);

            try {
                await SpeechRecognition.start({
                    language: "en-IN",
                    maxResults: 1,
                    prompt: "Speak now...",
                    partialResults: true,
                    popup: false,
                });

                // Add listener for partial results if supported or just wait for final?
                // The plugin usually returns matches in a listener or promise?
                // Actually, the start method might not return the text directly in all versions.
                // We need to add a listener.

                SpeechRecognition.addListener('partialResults', (data) => {
                    if (data.matches && data.matches.length > 0 && isMounted.current) {
                        setTranscript(data.matches[0]);
                    }
                });

            } catch (e) {
                console.error("Start error:", e);
                setIsListening(false);
            }
        }
    };

    // Add listener for final results outside toggle
    useEffect(() => {
        const resultListener = SpeechRecognition.addListener('listeningState', (data) => {
            if (!data.status && isListening) {
                // Stopped
                setIsListening(false);
            }
        });

        // Note: The plugin API varies. Some versions use 'partialResults' and 'matches'.
        // Let's assume standard behavior: we might need to handle the result in a separate listener.
        // Actually, for this plugin, usually we just get 'partialResults'.

        return () => {
            resultListener.remove();
            SpeechRecognition.removeAllListeners();
        };
    }, [isListening]);


    const speakResponse = (text) => {
        if ('speechSynthesis' in window && window.speechSynthesis) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.onstart = () => {
                if (isMounted.current) setIsSpeaking(true);
            };
            utterance.onend = () => {
                if (isMounted.current) setIsSpeaking(false);
            };
            window.speechSynthesis.speak(utterance);
        }
    };

    const handleSend = async (text) => {
        if (!text.trim()) return;
        setIsLoading(true);

        try {
            const data = await chatWithData(text, []);

            if (!isMounted.current) return;

            setResponse(data.response);
            speakResponse(data.response);
        } catch (error) {
            console.error(error);
            if (isMounted.current) {
                setResponse("Sorry, I had trouble connecting to the server.");
            }
        } finally {
            if (isMounted.current) setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] bg-gradient-to-b from-slate-900 to-slate-800 text-white p-6 relative overflow-hidden">

            {/* Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-10">
                <div className="absolute top-10 left-10 w-64 h-64 bg-blue-500 rounded-full blur-3xl"></div>
                <div className="absolute bottom-10 right-10 w-64 h-64 bg-purple-500 rounded-full blur-3xl"></div>
            </div>

            {/* Header */}
            <div className="relative z-10 flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                    Kirana Assistant
                </h1>
                {isSpeaking && <Volume2 className="text-green-400 animate-pulse" size={24} />}
            </div>

            {/* Main Content */}
            <div className="relative z-10 flex-1 flex flex-col items-center justify-center gap-8 text-center">

                {/* Response Area */}
                <div className="w-full max-w-md min-h-[150px] flex items-center justify-center">
                    {isLoading ? (
                        <Loader2 className="w-12 h-12 text-blue-400 animate-spin" />
                    ) : (
                        <p className={cn(
                            "text-xl md:text-2xl font-medium leading-relaxed transition-all duration-500",
                            response === "Listening..." ? "text-blue-300 animate-pulse" : "text-slate-100"
                        )}>
                            "{response}"
                        </p>
                    )}
                </div>

                {/* Transcript Area */}
                {transcript && (
                    <div className="bg-white/10 backdrop-blur-sm px-6 py-3 rounded-full border border-white/10">
                        <p className="text-sm text-slate-300">You said: <span className="text-white font-medium">{transcript}</span></p>
                    </div>
                )}

                {/* Mic Button */}
                <div className="relative group">
                    <div className={cn(
                        "absolute inset-0 bg-blue-500 rounded-full blur-xl transition-all duration-300 opacity-0",
                        isListening ? "opacity-50 scale-150" : "group-hover:opacity-30"
                    )}></div>
                    <button
                        onClick={toggleListening}
                        className={cn(
                            "relative w-24 h-24 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 border-4",
                            isListening
                                ? "bg-red-500 border-red-400 scale-110"
                                : "bg-blue-600 border-blue-400 hover:scale-105"
                        )}
                    >
                        {isListening ? (
                            <MicOff size={40} className="text-white" />
                        ) : (
                            <Mic size={40} className="text-white" />
                        )}
                    </button>
                </div>

                <p className="text-slate-400 text-sm">
                    {isListening ? "Listening..." : "Tap to speak"}
                </p>
            </div>
        </div>
    );
};

export default CustomerView;
