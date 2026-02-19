import React from 'react';
import { TrendingUp, ShieldCheck, AlertTriangle } from 'lucide-react';

export default function ComplianceWidget({ score = 85, trend = 5 }) {
    // Calculate circle properties
    const radius = 30;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    const getScoreColor = (s: number) => {
        if (s >= 80) return 'text-emerald-500';
        if (s >= 50) return 'text-amber-500';
        return 'text-red-500';
    };

    const getStrokeColor = (s: number) => {
        if (s >= 80) return '#10B981'; // Emerald 500
        if (s >= 50) return '#F59E0B'; // Amber 500
        return '#EF4444'; // Red 500
    };

    return (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex items-center justify-between relative overflow-hidden group hover:border-primary/20 transition-all">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none"></div>

            <div>
                <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Live Compliance Index</h3>
                <div className="flex items-baseline gap-2">
                    <span className={`text-4xl font-extrabold tracking-tight ${getScoreColor(score)}`}>{score}%</span>
                    <span className="text-xs font-bold text-emerald-600 flex items-center">
                        <TrendingUp className="w-3 h-3 mr-1" /> +{trend}%
                    </span>
                </div>
                <p className="text-xs text-slate-400 font-medium mt-1">Updated 2 mins ago</p>
            </div>

            {/* Circular Progress */}
            <div className="relative w-20 h-20 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                    <circle
                        cx="40"
                        cy="40"
                        r={radius}
                        fill="transparent"
                        stroke="#E2E8F0"
                        strokeWidth="6"
                    />
                    <circle
                        cx="40"
                        cy="40"
                        r={radius}
                        fill="transparent"
                        stroke={getStrokeColor(score)}
                        strokeWidth="6"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <ShieldCheck className={`w-8 h-8 ${getScoreColor(score)}`} />
                </div>
            </div>
        </div>
    );
}
