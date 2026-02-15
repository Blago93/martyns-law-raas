import React, { useState, useRef, useEffect } from 'react';
import SianNotification from '../../components/SianNotification';
import MarketingHeader from '../../components/marketing/Header';
import { Camera, AlertCircle, CheckCircle, RefreshCw, Pause, Play, Square } from 'lucide-react';

export default function RecordAudit() {
    const [status, setStatus] = useState<string>('Ready');
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
    const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
    const [hash, setHash] = useState<string | null>(null);
    const [isPaused, setIsPaused] = useState(false);

    // Live preview ref
    const videoRef = useRef<HTMLVideoElement>(null);

    // Initial Stream Setup
    const setupStream = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                // In production app, we would select the back camera specifically if available
                video: { facingMode: 'environment' },
                audio: true
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }

            const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    setRecordedChunks(prev => [...prev, e.data]);
                }
            };

            recorder.onstop = async () => {
                const blob = new Blob(recordedChunks, { type: 'video/webm' });
                // Hash the blob immediately
                const buffer = await blob.arrayBuffer();
                const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
                const hashArray = Array.from(new Uint8Array(hashBuffer));
                const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

                setHash(hashHex);
                localStorage.setItem('DigitalThreadStart', hashHex);
                // Redirect to Review Portal
                window.location.href = '/audit/review';
            };

            setMediaRecorder(recorder);
            setStatus('Ready');

        } catch (err: any) {
            console.error(err);
            let msg = 'Error: Camera/Mic Access Denied';
            if (err.name === 'NotAllowedError') msg = 'Error: Permission Denied. Check settings.';
            if (err.name === 'NotFoundError') msg = 'Error: No Camera/Mic found.';
            if (err.name === 'NotReadableError') msg = 'Error: Camera in use by another app.';
            if (window.location.protocol === 'http:' && window.location.hostname !== 'localhost') msg += ' (Hint: HTTPS Required!)';
            setStatus(msg);
        }
    };

    useEffect(() => {
        setupStream();
        return () => {
            // Cleanup tracks
            if (videoRef.current && videoRef.current.srcObject) {
                const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
                tracks.forEach(track => track.stop());
            }
        }
    }, []);

    const startRecording = () => {
        if (!mediaRecorder) return;
        setRecordedChunks([]); // Clear previous
        setHash(null);
        mediaRecorder.start(1000); // 1s slice for potential streaming
        setStatus('Recording...');
    };

    const pauseRecording = () => {
        if (!mediaRecorder) return;
        if (mediaRecorder.state === 'recording') {
            mediaRecorder.pause();
            setIsPaused(true);
            setStatus('Paused');
        }
    };

    const resumeRecording = () => {
        if (!mediaRecorder) return;
        if (mediaRecorder.state === 'paused') {
            mediaRecorder.resume();
            setIsPaused(false);
            setStatus('Recording...');
        }
    };

    const stopRecording = () => {
        if (!mediaRecorder) return;
        mediaRecorder.stop();
        // State update handled in onstop
    };

    const restartRecording = () => {
        // Discard data and reset
        setRecordedChunks([]);
        setHash(null);
        setIsPaused(false);
        // Ensure recorder is reset or state is clear
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
        }
        setStatus('Ready');
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-blue-500 selection:text-white">
            <MarketingHeader />

            <main className="pt-24 pb-20 px-4 max-w-6xl mx-auto grid md:grid-cols-2 gap-8 min-h-[calc(100vh-80px)]">

                {/* VIDEO PREVIEW */}
                <div className="flex flex-col">
                    <div className="bg-black rounded-3xl overflow-hidden aspect-[9/16] md:aspect-video shadow-2xl border border-white/10 relative">
                        <video
                            ref={videoRef}
                            autoPlay
                            muted
                            playsInline
                            className="w-full h-full object-cover"
                        ></video>

                        {/* Status Overlay */}
                        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-mono border border-white/10 flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${status === 'Recording...' ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                            {status}
                        </div>
                    </div>

                    {/* CONTROLS */}
                    <div className="mt-6 flex justify-center gap-4">
                        {status === 'Ready' || status.includes('Error') ? (
                            <button
                                onClick={startRecording}
                                className="bg-red-600 hover:bg-red-500 text-white font-bold py-4 px-8 rounded-full flex items-center gap-2 transition-all shadow-lg shadow-red-600/20"
                            >
                                <div className="w-4 h-4 bg-white rounded-full"></div> Start Recording
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={stopRecording}
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold p-4 rounded-full transition-all shadow-lg shadow-emerald-600/20"
                                    title="Finish & Save"
                                >
                                    <Square className="w-6 h-6 fill-current" />
                                </button>

                                {isPaused ? (
                                    <button
                                        onClick={resumeRecording}
                                        className="bg-amber-500 hover:bg-amber-400 text-black font-bold p-4 rounded-full transition-all"
                                        title="Resume"
                                    >
                                        <Play className="w-6 h-6 fill-current" />
                                    </button>
                                ) : (
                                    <button
                                        onClick={pauseRecording}
                                        className="bg-amber-500 hover:bg-amber-400 text-black font-bold p-4 rounded-full transition-all"
                                        title="Pause"
                                    >
                                        <Pause className="w-6 h-6 fill-current" />
                                    </button>
                                )}

                                <button
                                    onClick={restartRecording}
                                    className="bg-slate-700 hover:bg-slate-600 text-white font-bold p-4 rounded-full transition-all"
                                    title="Disclaimer"
                                >
                                    <RefreshCw className="w-6 h-6" />
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* GUIDANCE PANEL */}
                <div className="bg-slate-900/50 p-8 rounded-3xl border border-white/5 flex flex-col justify-center">
                    <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
                        <Camera className="text-blue-500" /> Video Audit
                    </h1>

                    <div className="space-y-6 text-slate-300">
                        <div className="flex gap-4">
                            <div className="mt-1"><AlertCircle className="text-blue-500" /></div>
                            <div>
                                <h3 className="font-bold text-white">How to Film</h3>
                                <p className="text-sm mt-1">Walk slowly around your venue. Film at a steady pace. Keep the camera at eye level.</p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="mt-1"><CheckCircle className="text-emerald-500" /></div>
                            <div>
                                <h3 className="font-bold text-white">Key Areas to Capture</h3>
                                <ul className="text-sm mt-1 space-y-1 list-disc list-inside text-slate-400">
                                    <li>All public Entrances & Exits</li>
                                    <li>Crowd gathering points (Bars, Stages)</li>
                                    <li>Fire Exits (Show they are clear)</li>
                                    <li>Parking or delivery areas</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 p-4 bg-blue-900/20 border border-blue-500/20 rounded-xl">
                        <p className="text-xs text-blue-300">
                            <strong>Note:</strong> Your video is processed locally to generate a cryptographic hash (Digital Thread). It is then securely uploaded for AI analysis in the next step.
                        </p>
                    </div>

                    {hash && (
                        <div className="mt-6">
                            <SianNotification />
                        </div>
                    )}
                </div>

            </main>
        </div>
    );
}
