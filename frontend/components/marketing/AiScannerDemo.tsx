'use client';
import { motion } from 'framer-motion';
import { Scan, AlertTriangle } from 'lucide-react';

export default function AiScannerDemo() {
    return (
        <div className="relative w-full max-w-4xl mx-auto h-[400px] bg-slate-900 rounded-xl overflow-hidden border border-slate-800 shadow-2xl">
            {/* Background Image (Mock Fire Exit) */}
            <div
                className="absolute inset-0 bg-cover bg-center opacity-60"
                style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1595846519845-68e298c2edd8?q=80&w=2574&auto=format&fit=crop")' }} // Generic corridor image
            ></div>

            {/* Scanning Grid Overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.1)_1px,transparent_1px)] bg-[size:40px_40px]"></div>

            {/* Scanning Line Animation */}
            <div className="absolute top-0 left-0 w-full h-[5px] bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.8)] animate-scan z-10"></div>

            {/* Detected Hazard Box */}
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.5, duration: 0.5 }}
                className="absolute top-[30%] left-[20%] w-[200px] h-[300px] border-4 border-red-500 bg-red-500/10 z-20"
            >
                {/* Hazard Label */}
                <div className="absolute -top-10 left-0 bg-red-600 text-white px-3 py-1 text-xs font-mono font-bold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    BLOCKED EGRESS (CRITICAL)
                </div>

                {/* Tracking Corners */}
                <div className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-white"></div>
                <div className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-white"></div>
                <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-white"></div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-white"></div>
            </motion.div>

            {/* HUD Overlay */}
            <div className="absolute bottom-4 left-4 font-mono text-emerald-400 text-xs">
                <div>AI_MODEL: CLAUDE-3.5-SONNET</div>
                <div>LATENCY: 42ms</div>
                <div className="animate-pulse">STATUS: SCANNING...</div>
            </div>

            <div className="absolute bottom-4 right-4 bg-slate-800/90 p-4 rounded-lg border border-slate-700 text-sm max-w-xs backdrop-blur-sm z-30">
                <div className="text-slate-400 text-xs uppercase mb-1">Recommendation Engine</div>
                <div className="font-bold text-white mb-1">Remove Obstruction</div>
                <div className="flex justify-between text-xs">
                    <span className="text-emerald-400">Cost: £0 (Reasonably Practicable)</span>
                </div>
            </div>
        </div>
    );
}
