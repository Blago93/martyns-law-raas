import { useState, useEffect } from 'react';
import Head from 'next/head';
import MarketingHeader from '../components/marketing/Header';
import { User, Building, Save, Bell, Shield } from 'lucide-react';

export default function Settings() {
    const [user, setUser] = useState('');
    const [venueName, setVenueName] = useState('Manchester Arena (Demo)');
    const [capacity, setCapacity] = useState('21000');

    useEffect(() => {
        const username = localStorage.getItem('raas_user');
        setUser(username || 'Admin');
    }, []);

    const handleSave = () => {
        alert('Settings Saved! (Mock)');
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-blue-500 selection:text-white font-sans">
            <Head>
                <title>Settings | RaaS Platform</title>
            </Head>

            <MarketingHeader />

            <main className="pt-32 pb-20 px-4 max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
                    <User className="text-blue-500" /> Account & Venue Settings
                </h1>

                <div className="space-y-6">

                    {/* PROFILE CARD */}
                    <div className="bg-slate-900 border border-white/5 rounded-2xl p-6">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <Shield className="w-5 h-5 text-emerald-500" /> Profile
                        </h2>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-400 mb-1">Username</label>
                                <input type="text" disabled value={user} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-slate-500 cursor-not-allowed" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-400 mb-1">Role</label>
                                <input type="text" disabled value="Venue Manager (Admin)" className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-slate-500 cursor-not-allowed" />
                            </div>
                        </div>
                    </div>

                    {/* VENUE CARD */}
                    <div className="bg-slate-900 border border-white/5 rounded-2xl p-6">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <Building className="w-5 h-5 text-blue-500" /> Venue Details
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-400 mb-1">Venue Name</label>
                                <input
                                    type="text"
                                    value={venueName}
                                    onChange={(e) => setVenueName(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-400 mb-1">Max Capacity (PAX)</label>
                                <input
                                    type="number"
                                    value={capacity}
                                    onChange={(e) => setCapacity(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                />
                                <p className="text-xs text-slate-500 mt-1">Used to determine Standard (100+) vs Enhanced (800+) Tier requirements.</p>
                            </div>
                        </div>
                    </div>

                    {/* NOTIFICATIONS */}
                    <div className="bg-slate-900 border border-white/5 rounded-2xl p-6">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <Bell className="w-5 h-5 text-amber-500" /> Notifications
                        </h2>
                        <div className="space-y-2">
                            <label className="flex items-center gap-3 p-3 bg-slate-950 rounded-lg cursor-pointer hover:bg-slate-800 transition-colors">
                                <input type="checkbox" defaultChecked className="rounded border-slate-700 bg-slate-800 text-blue-500" />
                                <span className="text-sm">Email me when PDF reports are generated</span>
                            </label>
                            <label className="flex items-center gap-3 p-3 bg-slate-950 rounded-lg cursor-pointer hover:bg-slate-800 transition-colors">
                                <input type="checkbox" defaultChecked className="rounded border-slate-700 bg-slate-800 text-blue-500" />
                                <span className="text-sm">Alert me if "Critical" risks are detected</span>
                            </label>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            onClick={handleSave}
                            className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-xl flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all"
                        >
                            <Save className="w-4 h-4" /> Save Changes
                        </button>
                    </div>

                </div>
            </main>
        </div>
    );
}
