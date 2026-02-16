import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import MarketingHeader from '../components/marketing/Header';
import { Shield, ArrowRight, Calendar, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface AuditSummary {
    digital_thread_id: string;
    date: string;
    total_findings: string; // Counts come as strings from PG
    pending_count: string;
    critical_count: string;
}

export default function ArchivePage() {
    const [audits, setAudits] = useState<AuditSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'ALL' | 'CRITICAL' | 'PENDING'>('ALL'); // NEW State
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const router = useRouter();

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await fetch(`${API_URL}/api/audit/history`);
                if (res.ok) {
                    const data = await res.json();
                    setAudits(data);
                }
            } catch (e) {
                console.error("Failed to fetch history", e);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    // Filter Logic
    const filteredAudits = audits.filter(audit => {
        if (filter === 'CRITICAL') return parseInt(audit.critical_count) > 0;
        if (filter === 'PENDING') return parseInt(audit.pending_count) > 0;
        return true;
    });

    // Helper to continue audit
    const continueAudit = (id: string) => {
        // Store ID and go to review
        localStorage.setItem('DigitalThreadStart', id);
        // Note: review page fetches ALL findings right now, we might want to filter by ID later
        // For MVP, since we only have one "active" audit logic really, this is OK.
        // Ideally we would pass ?threadId=XYZ to review page.
        router.push('/audit/review');
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-blue-500 selection:text-white">
            <Head>
                <title>Audit Archive | RaaS</title>
            </Head>

            <MarketingHeader />

            <main className="pt-32 pb-20 px-4 max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
                    <div>
                        <h1 className="text-3xl font-bold mb-4 flex items-center gap-3">
                            <Clock className="text-blue-500" /> Audit Archive
                        </h1>
                        <p className="text-slate-400 max-w-2xl">
                            View past risk assessments and track your compliance progress over time.
                            Each entry represents a unique "Digital Thread" of evidence.
                        </p>
                    </div>

                    {/* FILTER CONTROLS */}
                    <div className="flex bg-slate-900 p-1 rounded-xl border border-white/5">
                        <button
                            onClick={() => setFilter('ALL')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filter === 'ALL' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setFilter('CRITICAL')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${filter === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/50' : 'text-slate-400 hover:text-white'}`}
                        >
                            <AlertTriangle className="w-3 h-3" /> Critical
                        </button>
                        <button
                            onClick={() => setFilter('PENDING')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${filter === 'PENDING' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50' : 'text-slate-400 hover:text-white'}`}
                        >
                            <Clock className="w-3 h-3" /> Pending
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-20 text-slate-500 animate-pulse">Loading archive...</div>
                ) : filteredAudits.length === 0 ? (
                    <div className="text-center py-20 bg-slate-900/50 rounded-3xl border border-white/5">
                        <Shield className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-slate-300">No Audits Found</h3>
                        <p className="text-slate-500 mb-8">
                            {filter === 'ALL' ? "You haven't completed any video assessments yet." : "No audits match your filter."}
                        </p>
                        {filter === 'ALL' && (
                            <button
                                onClick={() => router.push('/audit/record')}
                                className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold"
                            >
                                Start New Audit
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {filteredAudits.map((audit) => (
                            <div key={audit.digital_thread_id} className="bg-slate-900 border border-white/5 rounded-2xl p-6 hover:border-blue-500/30 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-6">

                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="font-mono text-xs bg-slate-800 text-blue-400 px-2 py-1 rounded">
                                            {audit.digital_thread_id}
                                        </span>
                                        <span className="text-slate-500 text-xs flex items-center gap-1">
                                            <Calendar className="w-3 h-3" /> {new Date(audit.date).toLocaleDateString()}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-6 text-sm">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-slate-500"></div>
                                            <span className="text-slate-300">Total: <strong>{audit.total_findings}</strong></span>
                                        </div>
                                        {parseInt(audit.critical_count) > 0 && (
                                            <div className="flex items-center gap-2 text-red-400">
                                                <AlertTriangle className="w-4 h-4" />
                                                <strong>{audit.critical_count} Critical</strong>
                                            </div>
                                        )}
                                        {parseInt(audit.pending_count) === 0 ? (
                                            <div className="flex items-center gap-2 text-emerald-400">
                                                <CheckCircle className="w-4 h-4" />
                                                <strong>Completed</strong>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 text-amber-400">
                                                <Clock className="w-4 h-4" />
                                                <strong>{audit.pending_count} Pending Review</strong>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <button
                                    onClick={() => continueAudit(audit.digital_thread_id)}
                                    className="bg-slate-800 hover:bg-slate-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 border border-white/5 transition-colors whitespace-nowrap"
                                >
                                    View Details <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
