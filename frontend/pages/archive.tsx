import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import MarketingHeader from '../components/marketing/Header';
import { Shield, ArrowRight, Calendar, AlertTriangle, CheckCircle, Clock, Lock, Loader2 } from 'lucide-react';

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
        <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 selection:text-primary font-sans">
            <Head>
                <title>Audit Archive | RaaS</title>
            </Head>

            <MarketingHeader />

            <main className="pt-32 pb-20 px-4 max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 pb-8 border-b border-slate-200">
                    <div>
                        <h1 className="text-3xl font-extrabold mb-4 flex items-center gap-3 text-primary tracking-tight">
                            <Clock className="text-primary fill-primary/10" /> Audit Archive
                        </h1>
                        <p className="text-slate-500 font-medium max-w-2xl">
                            Historical record of compliance assessments. Each entry represents a unique
                            <span className="text-primary font-bold"> Digital Thread</span> of immutable evidence.
                        </p>
                    </div>

                    {/* FILTER CONTROLS */}
                    <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-sm">
                        <button
                            onClick={() => setFilter('ALL')}
                            className={`px-6 py-2 rounded-xl text-xs font-extrabold uppercase tracking-widest transition-all ${filter === 'ALL' ? 'bg-white text-primary shadow-sm ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            All Logs
                        </button>
                        <button
                            onClick={() => setFilter('CRITICAL')}
                            className={`px-6 py-2 rounded-xl text-xs font-extrabold uppercase tracking-widest transition-all flex items-center gap-2 ${filter === 'CRITICAL' ? 'bg-red-50 text-red-700 ring-1 ring-red-200 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <AlertTriangle className="w-3 h-3" /> Critical Hazards
                        </button>
                        <button
                            onClick={() => setFilter('PENDING')}
                            className={`px-6 py-2 rounded-xl text-xs font-extrabold uppercase tracking-widest transition-all flex items-center gap-2 ${filter === 'PENDING' ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <Clock className="w-3 h-3" /> In Review
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-40">
                        <Loader2 className="w-12 h-12 text-primary/20 animate-spin mb-4" />
                        <div className="text-slate-400 font-bold uppercase tracking-widest text-xs">Retrieving Digital Repository...</div>
                    </div>
                ) : filteredAudits.length === 0 ? (
                    <div className="text-center py-24 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm">
                        <Shield className="w-20 h-20 text-slate-100 mx-auto mb-6" />
                        <h3 className="text-2xl font-extrabold text-primary tracking-tight">Digital Archive Empty</h3>
                        <p className="text-slate-500 font-medium mb-10 max-w-sm mx-auto">
                            {filter === 'ALL' ? "No historical compliance data exists for this facility yet." : "No records match your current organizational filter."}
                        </p>
                        {filter === 'ALL' && (
                            <button
                                onClick={() => router.push('/audit/record')}
                                className="bg-primary hover:bg-primary/95 text-white px-8 py-4 rounded-2xl font-bold transition-all shadow-xl shadow-primary/20"
                            >
                                Start First Audit
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {filteredAudits.map((audit) => (
                            <div key={audit.digital_thread_id} className="bg-white border border-slate-200 rounded-[2rem] p-8 hover:border-primary/20 transition-all flex flex-col md:flex-row items-center justify-between gap-8 group shadow-sm hover:shadow-md">

                                <div className="flex-1">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg flex items-center gap-2">
                                            <Lock className="w-3 h-3 text-emerald-600" />
                                            <span className="font-mono text-[10px] font-bold text-primary uppercase tracking-tighter">
                                                ID: {audit.digital_thread_id}
                                            </span>
                                        </div>
                                        <div className="text-slate-400 text-[10px] font-extrabold uppercase tracking-widest flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg">
                                            <Calendar className="w-3.5 h-3.5" /> {new Date(audit.date).toLocaleDateString()}
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-8 text-sm font-bold uppercase tracking-tight text-slate-400">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                                            <span>Total Findings: <span className="text-primary">{audit.total_findings}</span></span>
                                        </div>
                                        {parseInt(audit.critical_count) > 0 && (
                                            <div className="flex items-center gap-2.5 text-red-600 bg-red-50/50 px-3 py-1.5 rounded-full border border-red-100">
                                                <AlertTriangle className="w-4 h-4" />
                                                <span>{audit.critical_count} Critical Risks</span>
                                            </div>
                                        )}
                                        {parseInt(audit.pending_count) === 0 ? (
                                            <div className="flex items-center gap-2.5 text-emerald-600 bg-emerald-50/50 px-3 py-1.5 rounded-full border border-emerald-100">
                                                <CheckCircle className="w-4 h-4" />
                                                <span>Audit Formalized</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2.5 text-amber-600 bg-amber-50/50 px-3 py-1.5 rounded-full border border-amber-100">
                                                <Clock className="w-4 h-4" />
                                                <span>{audit.pending_count} Items in Review</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <button
                                    onClick={() => continueAudit(audit.digital_thread_id)}
                                    className="bg-primary hover:bg-primary/95 text-white px-8 py-4 rounded-2xl font-bold text-sm flex items-center gap-3 transition-all shadow-xl shadow-primary/10 group-hover:scale-[1.02]"
                                >
                                    Access Archive <ArrowRight className="w-5 h-5" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
