'use client';
import { useState } from 'react';
import { ArrowRight, Building } from 'lucide-react';

export default function TierChecker() {
    const [capacity, setCapacity] = useState<number | ''>('');
    const [result, setResult] = useState<{ tier: string, color: string, msg: string } | null>(null);

    const checkTier = () => {
        if (capacity === '') return;
        const c = Number(capacity);
        if (c < 100) setResult({ tier: "EXEMPT", color: "text-slate-500", msg: "You are likely exempt from specific Martyn's Law duties, but vigilance is encouraged." });
        else if (c < 200) setResult({ tier: "BORDERLINE", color: "text-amber-500", msg: "Keep an eye on legislation. Official threshold starts at 200." });
        else if (c < 800) setResult({ tier: "STANDARD TIER", color: "text-emerald-600", msg: "You MUST have a 'Standard Terrorism Evaluation'. Our app is built exactly for you." });
        else setResult({ tier: "ENHANCED TIER", color: "text-purple-600", msg: "You require heavy physical security measures. Please contact our Enterprise team." });
    };

    return (
        <div className="bg-slate-900 text-white p-8 rounded-xl shadow-2xl max-w-md mx-auto border border-slate-700">
            <div className="flex items-center gap-3 mb-6">
                <Building className="text-blue-400" />
                <h3 className="font-bold text-xl">Am I Affected?</h3>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm text-slate-400 mb-2">Maximum Venue Capacity</label>
                    <input
                        type="number"
                        placeholder="e.g. 350"
                        value={capacity}
                        onChange={(e) => setCapacity(Number(e.target.value))}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                    />
                </div>

                <button
                    onClick={checkTier}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all"
                >
                    Check My Tier <ArrowRight className="w-4 h-4" />
                </button>

                {result && (
                    <div className="mt-4 p-4 bg-slate-800 rounded-lg border border-slate-700 animate-in fade-in slide-in-from-top-4">
                        <div className={`font-bold text-lg mb-1 ${result.color}`}>{result.tier}</div>
                        <p className="text-sm text-slate-300">{result.msg}</p>

                        {result.tier === 'STANDARD TIER' && (
                            <a href="/login" className="block mt-3 text-center bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold py-2 rounded transition-colors">
                                Start Free Assessment Now
                            </a>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
