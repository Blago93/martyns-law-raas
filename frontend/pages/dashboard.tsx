import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import { Video, FileText, Settings, Shield, Plus, ArrowRight } from 'lucide-react';
import ComplianceWidget from '../components/dashboard/ComplianceWidget';

export default function Dashboard() {
    const router = useRouter();
    const [authorized, setAuthorized] = useState(false);
    const [username, setUsername] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('raas_token');
        const user = localStorage.getItem('raas_user');

        // Simple client-side check. 
        // Real security is handled by the backend rejecting requests without valid tokens.
        if (!token) {
            router.push('/login');
        } else {
            setAuthorized(true);
            setUsername(user || 'User');
        }
    }, [router]);

    if (!authorized) return null;

    return (
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20 selection:text-primary">
            <Head>
                <title>Dashboard | RaaS Platform</title>
            </Head>

            <main className="pt-32 pb-20 px-4 max-w-6xl mx-auto">

                {/* WELCOME SECTION */}
                <div className="mb-12">
                    <h1 className="text-3xl md:text-4xl font-extrabold mb-2 tracking-tight text-primary">
                        Welcome back, <span className="capitalize">{username}</span>.
                    </h1>
                    <p className="text-slate-500 font-medium">Here is your compliance overview for Martyn's Law.</p>
                </div>

                {/* MAIN ACTIONS GRID */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">

                    {/* STATS WIDGET */}
                    <div className="col-span-1 md:col-span-2 lg:col-span-3">
                        <ComplianceWidget score={85} trend={12} />
                    </div>

                    <div className="bg-[hsl(var(--card-bg-light))] rounded-3xl p-1 shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all cursor-pointer group col-span-1 md:col-span-2 lg:col-span-1 border border-slate-100">
                        <Link href="/audit/questionnaire" className="block bg-primary hover:bg-primary/95 h-full rounded-[20px] p-8 transition-colors relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-30 group-hover:opacity-100 transition-opacity">
                                <ArrowRight className="w-6 h-6 text-white" />
                            </div>
                            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-6 ring-1 ring-white/20">
                                <Video className="w-8 h-8 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">New Video Audit</h2>
                            <p className="text-white/70">Start a new walkthrough to identify risks and generate your Digital Thread.</p>
                        </Link>
                    </div>

                    {/* ACTION 2: REPORTS */}
                    <div className="bg-[hsl(var(--card-bg-light))] border border-slate-200 rounded-3xl p-8 hover:border-primary/20 transition-all shadow-sm hover:shadow-md group">
                        <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6 border border-emerald-100 group-hover:bg-emerald-100 transition-colors">
                            <FileText className="w-8 h-8 text-emerald-600" />
                        </div>
                        <h2 className="text-xl font-bold mb-2 text-[hsl(var(--text-main-light))]">My Reports</h2>
                        <p className="text-slate-500 text-sm mb-6 font-medium">View your past compliance PDF certificates and digital threads.</p>
                        <Link href="/archive" className="text-sm font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 group/link">
                            View Archive <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
                        </Link>
                    </div>

                    {/* ACTION 3: SETTINGS */}
                    <div className="bg-[hsl(var(--card-bg-light))] border border-slate-200 rounded-3xl p-8 hover:border-primary/20 transition-all shadow-sm hover:shadow-md group">
                        <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 border border-slate-100 group-hover:bg-slate-100 transition-colors">
                            <Settings className="w-8 h-8 text-slate-600" />
                        </div>
                        <h2 className="text-xl font-bold mb-2 text-[hsl(var(--text-main-light))]">Venue Settings</h2>
                        <p className="text-slate-500 text-sm mb-6 font-medium">Manage capacity limits, venue addresses, and responsible persons.</p>
                        <Link href="/settings" className="text-sm font-bold text-slate-600 hover:text-primary flex items-center gap-1 group/link">
                            Manage Settings <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                </div>

                {/* STATUS BAR */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-3 h-3 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                        <span className="text-slate-600 font-bold text-sm uppercase tracking-wide">System Status: Operational</span>
                    </div>
                    <div className="text-slate-400 text-xs font-mono">
                        Connected to Martyn's Law RaaS Core v1.0
                    </div>
                </div>

            </main>
        </div>
    );
}
