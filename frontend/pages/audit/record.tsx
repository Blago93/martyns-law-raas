import React, { useState, useRef, useEffect } from 'react';
import SianNotification from '../../components/SianNotification';
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

    // Transcript State
    const [transcript, setTranscript] = useState('');
    const recognitionRef = useRef<any>(null);

    // Initial Stream Setup
    const setupStream = async () => {
        try {
            // Setup Speech Recognition
            if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
                const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
                recognitionRef.current = new SpeechRecognition();
                recognitionRef.current.continuous = true;
                recognitionRef.current.interimResults = true;

                recognitionRef.current.onresult = (event: any) => {
                    let finalTranscript = '';
                    for (let i = event.resultIndex; i < event.results.length; ++i) {
                        if (event.results[i].isFinal) {
                            finalTranscript += event.results[i][0].transcript + '. ';
                        }
                    }
                    if (finalTranscript) {
                        setTranscript(prev => prev + finalTranscript);
                    }
                };
            }

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

                // SAVE TRANSCRIPT
                console.log("Saving Transcript:", transcript);
                localStorage.setItem('raas_transcript', transcript);

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
        setTranscript(''); // Clear transcript
        setHash(null);
        mediaRecorder.start(1000); // 1s slice for potential streaming

        // Start Speech
        if (recognitionRef.current) {
            try { recognitionRef.current.start(); } catch (e) { console.log("Speech already started"); }
        }

        setStatus('Recording...');
    };

    const pauseRecording = () => {
        if (!mediaRecorder) return;
        if (mediaRecorder.state === 'recording') {
            mediaRecorder.pause();

            // Pause Speech
            if (recognitionRef.current) recognitionRef.current.stop();

            setIsPaused(true);
            setStatus('Paused');
        }
    };

    const resumeRecording = () => {
        if (!mediaRecorder) return;
        if (mediaRecorder.state === 'paused') {
            mediaRecorder.resume();

            // Resume Speech
            if (recognitionRef.current) {
                try { recognitionRef.current.start(); } catch (e) { console.log("Speech restart failed", e); }
            }

            setIsPaused(false);
            setStatus('Recording...');
        }
    };

    const stopRecording = () => {
        if (!mediaRecorder) return;
        mediaRecorder.stop();
        if (recognitionRef.current) recognitionRef.current.stop();
        // State update handled in onstop
    };

    const restartRecording = () => {
        // Discard data and reset
        setRecordedChunks([]);
        setTranscript('');
        setHash(null);
        setIsPaused(false);
        // Ensure recorder is reset or state is clear
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
        }
        if (recognitionRef.current) recognitionRef.current.stop();
        setStatus('Ready');
    };

    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 selection:text-primary font-sans">
            {/* Header handled by Layout */}

            <main className="pt-24 pb-20 px-4 max-w-6xl mx-auto grid md:grid-cols-2 gap-8 min-h-[calc(100vh-80px)]">

                {/* VIDEO PREVIEW */}
                <div className="flex flex-col relative order-2 md:order-1">
                    <div className="bg-slate-900 rounded-[2.5rem] overflow-hidden aspect-[9/16] md:aspect-video shadow-2xl border border-slate-200 relative group">
                        <video
                            ref={videoRef}
                            autoPlay
                            muted
                            playsInline
                            className="w-full h-full object-cover opacity-90"
                        ></video>
                        <canvas ref={canvasRef} className="hidden" /> {/* Analysis Canvas */}

                        {/* Landscape Hint */}
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-primary/20 backdrop-blur-sm">
                            <div className="bg-white/90 backdrop-blur text-primary px-6 py-3 rounded-full flex items-center gap-3 border border-white/20 shadow-xl">
                                <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                                <span className="text-xs font-extrabold uppercase tracking-widest">Landscape Recommended for Fidelity</span>
                            </div>
                        </div>

                        {/* Status Overlay */}
                        <div className="absolute top-6 left-6 bg-background/80 backdrop-blur-md px-4 py-2 rounded-2xl text-[10px] font-extrabold uppercase tracking-widest border border-slate-200/50 flex items-center gap-3 text-primary shadow-lg">
                            <div className={`w-2.5 h-2.5 rounded-full ${status === 'Recording...' ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                            {status}
                        </div>
                    </div>

                    {/* CONTROLS */}
                    <div className="mt-8 flex justify-center items-center gap-8">
                        {status === 'Ready' || status.includes('Error') ? (
                            <button
                                onClick={startRecording}
                                className="bg-red-600 hover:bg-red-700 text-white font-extrabold py-5 px-10 rounded-full flex items-center gap-4 transition-all shadow-2xl shadow-red-600/20 hover:scale-105 active:scale-95"
                            >
                                <div className="w-5 h-5 bg-white rounded-full shadow-[0_0_12px_rgba(255,255,255,0.8)]"></div>
                                <span className="uppercase tracking-widest text-sm">Initiate Evidence Capture</span>
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={stopRecording}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold p-6 rounded-full transition-all shadow-xl shadow-emerald-600/20 hover:scale-110 active:scale-90"
                                    title="Seal & Submit"
                                >
                                    <Square className="w-8 h-8 fill-current" />
                                </button>

                                {isPaused ? (
                                    <button
                                        onClick={resumeRecording}
                                        className="bg-primary hover:bg-primary/95 text-white font-bold p-6 rounded-full transition-all shadow-xl shadow-primary/20 hover:scale-110 active:scale-90"
                                        title="Resume"
                                    >
                                        <Play className="w-8 h-8 fill-current" />
                                    </button>
                                ) : (
                                    <button
                                        onClick={pauseRecording}
                                        className="bg-amber-500 hover:bg-amber-600 text-white font-bold p-6 rounded-full transition-all shadow-xl shadow-amber-500/20 hover:scale-110 active:scale-90"
                                        title="Pause"
                                    >
                                        <Pause className="w-8 h-8 fill-current" />
                                    </button>
                                )}

                                <button
                                    onClick={restartRecording}
                                    className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold p-6 rounded-full transition-all border border-slate-200 hover:scale-110 active:scale-90"
                                    title="Discard & Restart"
                                >
                                    <RefreshCw className="w-8 h-8" />
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* GUIDANCE PANEL */}
                <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 flex flex-col justify-center shadow-sm order-1 md:order-2 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>

                    <h1 className="text-3xl font-extrabold mb-8 flex items-center gap-4 text-primary tracking-tight">
                        <Camera className="text-primary fill-primary/10 w-8 h-8" /> Digital Audit
                    </h1>

                    <div className="space-y-8 text-slate-600">
                        <div className="flex gap-5">
                            <div className="mt-1 bg-primary/10 p-2 rounded-xl"><AlertCircle className="text-primary w-5 h-5" /></div>
                            <div>
                                <h3 className="font-extrabold text-primary uppercase tracking-widest text-xs mb-2">Protocol: Capture Motion</h3>
                                <p className="text-sm font-medium leading-relaxed">Walk deliberately through the security perimeter. The AI tracks <span className="text-primary font-bold">digital continuity</span> to ensure evidence integrity.</p>
                            </div>
                        </div>

                        <div className="flex gap-5">
                            <div className="mt-1 bg-emerald-50 p-2 rounded-xl"><CheckCircle className="text-emerald-600 w-5 h-5" /></div>
                            <div>
                                <h3 className="font-extrabold text-emerald-600 uppercase tracking-widest text-xs mb-2">Required Coverage</h3>
                                <ul className="text-sm font-medium space-y-2 text-slate-500">
                                    <li className="flex items-center gap-2 underline decoration-emerald-200 decoration-2 underline-offset-4">Primary & Secondary Egress</li>
                                    <li className="flex items-center gap-2 underline decoration-emerald-200 decoration-2 underline-offset-4">High-Occupancy Concentration Zones</li>
                                    <li className="flex items-center gap-2 underline decoration-emerald-200 decoration-2 underline-offset-4">Physical Security Barriers (Bollards/Gates)</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="mt-10 p-6 bg-slate-50 border border-slate-200 rounded-3xl relative">
                        <p className="text-xs text-slate-500 font-medium leading-relaxed">
                            <span className="font-bold text-primary">Cryptographic Assurance:</span> Your capture generates an immutable <span className="font-mono text-primary/70">SHA-256</span> thread locally before secure cloud distribution.
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
