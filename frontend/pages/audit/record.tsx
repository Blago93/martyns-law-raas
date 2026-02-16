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
    const canvasRef = useRef<HTMLCanvasElement>(null); // Hidden canvas for analysis

    // Sharpness Detection (Laplacian Variance)
    const calculateSharpness = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        // Convert to grayscale
        const gray = new Uint8ClampedArray(width * height);
        for (let i = 0; i < data.length; i += 4) {
            gray[i / 4] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        }

        // Simple Laplacian convolution kernel
        // [0,  1, 0]
        // [1, -4, 1]
        // [0,  1, 0]
        let mean = 0;
        const laplacian = new Float32Array(width * height);

        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const idx = y * width + x;
                // Convolve
                const val =
                    gray[idx - width] +
                    gray[idx - 1] - 4 * gray[idx] + gray[idx + 1] +
                    gray[idx + width];

                laplacian[idx] = val;
                mean += val;
            }
        }
        mean /= (width * height);

        // Variance
        let variance = 0;
        for (let i = 0; i < laplacian.length; i++) {
            variance += Math.pow(laplacian[i] - mean, 2);
        }
        return variance / (width * height);
    };

    // Initial Stream Setup
    const setupStream = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                // HIGH RES CONSTRAINTS
                video: {
                    facingMode: 'environment',
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                },
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
                // Hash the blob
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

            // Start Analysis Loop
            analyzeFrameLoop();

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

    // Frame Analysis Loop
    const analyzeFrameLoop = () => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        const checkFrame = () => {
            if (video.paused || video.ended) return;

            if (ctx && video.videoWidth > 0) {
                canvas.width = 320; // Downscale for performance
                canvas.height = (video.videoHeight / video.videoWidth) * 320;

                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                // Check Sharpness
                const score = calculateSharpness(ctx, canvas.width, canvas.height);
                // console.log("Sharpness Score:", score); // Debug

                // Threshold e.g. 50? Depends on content. 
                // If SUPER sharp, save it as potential 'Best Frame' for AI
                if (score > 100) {
                    // Capture full res frame
                    const fullCanvas = document.createElement('canvas');
                    fullCanvas.width = video.videoWidth;
                    fullCanvas.height = video.videoHeight;
                    fullCanvas.getContext('2d')?.drawImage(video, 0, 0);
                    const base64 = fullCanvas.toDataURL('image/jpeg', 0.9); // Quality 0.9

                    // Store in LocalStorage for Review page to pick up (Simple data passing)
                    localStorage.setItem('AuditBestFrame', base64);
                }
            }
            requestAnimationFrame(checkFrame);
        };
        requestAnimationFrame(checkFrame);
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
                <div className="flex flex-col relative">
                    <div className="bg-black rounded-3xl overflow-hidden aspect-[9/16] md:aspect-video shadow-2xl border border-white/10 relative group">
                        <video
                            ref={videoRef}
                            autoPlay
                            muted
                            playsInline
                            className="w-full h-full object-cover"
                        ></video>
                        <canvas ref={canvasRef} className="hidden" /> {/* Analysis Canvas */}

                        {/* Landscape Hint */}
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-0 md:opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-sm">
                            <div className="bg-black/60 text-white px-4 py-2 rounded-full flex items-center gap-2 border border-white/20">
                                <div className="animate-spin-slow w-4 h-4 border-2 border-white/50 border-t-white rounded-full"></div>
                                <span className="text-sm font-bold">For best results, rotate phone to Landscape ↔️</span>
                            </div>
                        </div>

                        {/* Mobile-only visible landscape hint (always on if portrait) */}
                        <div className="md:hidden absolute bottom-20 left-0 right-0 flex justify-center pointer-events-none">
                            <div className="bg-black/60 backdrop-blur-md text-white/80 px-4 py-1 rounded-full text-xs border border-white/10">
                                ↔️ Landscape Mode Recommended
                            </div>
                        </div>

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
