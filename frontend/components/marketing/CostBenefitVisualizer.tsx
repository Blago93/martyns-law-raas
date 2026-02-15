'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { PoundSign, CheckCircle, XCircle, ShieldCheck } from 'lucide-react';

export default function CostBenefitVisualizer() {
    const [budget, setBudget] = useState(0);

    // Mock logic engine results
    const getRecommendation = (b: number) => {
        if (b < 1000) return {
            measure: "Procedural Control",
            detail: "Instruct staff to lock rear doors manually.",
            cost: "£0",
            status: "REQUIRED",
            reason: "Cost is effectively zero. Risk reduction is high."
        };
        return {
            measure: "Physical Fortification",
            detail: "Install biometric access control and blast shutters.",
            cost: "£15,000",
            status: "OPTIONAL",
            reason: "Grossly Disproportionate (GDF > 15) for Standard Tier.",
            note: "You are NOT legally required to buy this."
        };
    };

    const rec = getRecommendation(budget);

    return (
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-8 max-w-2xl mx-auto">
            <h3 className="text-xl font-bold mb-2 text-slate-900">The "Reasonably Practicable" Engine</h3>
            <p className="text-slate-500 mb-8 text-sm">
                Martyn's Law doesn't demand you bankrupt your venue. It demands you do what is reasonable.
                Move the slider to see how your budget affects your legal obligations.
            </p>

            <div className="mb-8">
                <label className="text-xs font-bold uppercase text-slate-400 mb-2 block">Your Security Budget</label>
                <input
                    type="range"
                    min="0"
                    max="5000"
                    step="1000"
                    value={budget}
                    onChange={(e) => setBudget(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between mt-2 font-mono text-sm font-bold text-blue-600">
                    <span>£0 (Village Hall)</span>
                    <span>£5,000+ (High Budget)</span>
                </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-6 border border-slate-200 relative overflow-hidden transition-all duration-300">
                <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-full ${rec.status === 'REQUIRED' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                        {rec.status === 'REQUIRED' ? <CheckCircle /> : <ShieldCheck />}
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold text-lg text-slate-900">{rec.measure}</h4>
                            <span className={`text-[10px] uppercase px-2 py-0.5 rounded font-bold ${rec.status === 'REQUIRED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                }`}>
                                {rec.status}
                            </span>
                        </div>
                        <p className="text-slate-600 mb-2">{rec.detail}</p>
                        <div className="text-xs font-mono text-slate-500 bg-white inline-block px-2 py-1 rounded border border-slate-200">
                            Legal Logic: {rec.reason}
                        </div>
                        {rec.note && (
                            <p className="text-xs text-amber-600 font-bold mt-2">{rec.note}</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
