import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import { Video, FileText, Settings, Shield, Plus, ArrowRight } from 'lucide-react';
import MarketingHeader from '../components/marketing/Header';

export default function Dashboard() {
    const router = useRouter();
    const [authorized, setAuthorized] = useState(false);
    const [username, setUsername] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('raas_token');
        const user = localStorage.getItem('raas_user');
        if (!token) {
            router.push('/login');
        } else {
            setAuthorized(true);
            setUsername(user || 'User');
        }
    }, [router]);

    if (!authorized) return null;

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-500 selection:text-white">
            <Head>
                <title>Dashboard | RaaS Platform</title>
            </Head>

            <MarketingHeader />

            <main className="pt-32 pb-20 px-4 max-w-6xl mx-auto">

                {/* WELCOME SECTION */}
                <div className="mb-12">
                    <h1 className="text-3xl md:text-4xl font-bold mb-2">
                        Welcome back, <span className="text-blue-500 capitalize">{username}</span>.
                    </h1>
                    <p className="text-slate-400">Here is your compliance overview.</p>
                </div>

                {/* MAIN ACTIONS GRID */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">

                    {/* ACTION 1: START AUDIT (The main focus) */}
                    <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl p-1 shadow-2xl hover:scale-[1.02] transition-transform cursor-pointer group col-span-1 md:col-span-2 lg:col-span-1">
                        <Link href="/audit/record" className="block bg-slate-900/50 hover:bg-slate-900/30 h-full rounded-[20px] p-8 transition-colors relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-50 group-hover:opacity-100 transition-opacity">
                                <ArrowRight className="w-6 h-6 text-white" />
                            </div>
                            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
                                <Video className="w-8 h-8 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">New Video Audit</h2>
                            <p className="text-blue-100">Start a new walkthrough to identify risks and generate your Digital Thread.</p>
                        </Link>
                    </div>

                    {/* ACTION 2: REPORTS */}
                    <div className="bg-slate-900 border border-white/5 rounded-3xl p-8 hover:border-blue-500/30 transition-colors">
                        <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6">
                            <FileText className="w-8 h-8 text-emerald-500" />
                        </div>
                        <h2 className="text-xl font-bold mb-2">My Reports</h2>
                        <p className="text-slate-400 text-sm mb-6">view your past compliance PDF certificates.</p>
                        <Link href="/archive" className="text-sm font-bold text-emerald-500 hover:text-emerald-400 flex items-center gap-1">
                            View Archive <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>

                    {/* ACTION 3: SETTINGS */}
                    <div className="bg-slate-900 border border-white/5 rounded-3xl p-8 hover:border-blue-500/30 transition-colors">
                        <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center mb-6">
                            <Settings className="w-8 h-8 text-slate-400" />
                        </div>
                        <h2 className="text-xl font-bold mb-2">Venue Settings</h2>
                        <p className="text-slate-400 text-sm mb-6">Manage capacity limits and responsible persons.</p>
                        <Link href="/settings" className="text-sm font-bold text-slate-400 hover:text-white flex items-center gap-1">
                            Manage <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>

                {/* STATUS BAR */}
                <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                        <span className="text-slate-300 font-medium">System Status: Operational</span>
                    </div>
                    <div className="text-slate-500 text-sm">
                        Last Login: Just now
                    </div>
                </div>

            </main>
        </div>
    );
}
