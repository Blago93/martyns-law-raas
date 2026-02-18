import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Shield, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import '../app/globals.css'; // Ensure Tailwind works

export default function Login() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        // Simulate API delay
        setTimeout(() => {
            // Mock Verification Logic matching User Request
            // Note: In production this would be a real API call
            if (username.toLowerCase() === 'admin' && password === 'Blago1234') {
                localStorage.setItem('raas_token', 'mock_valid_token');
                localStorage.setItem('raas_user', username);
                router.push('/dashboard');
            } else {
                setError('Invalid credentials. Please try again.');
                setIsLoading(false);
            }
        }, 1000);
    };

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans selection:bg-primary/20 selection:text-primary">
            <Head>
                <title>Auditor Login | RaaS Platform</title>
            </Head>

            {/* Subtle Gradient Background */}
            <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none"></div>

            <div className="w-full max-w-lg relative z-10">

                {/* Logo Area */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-3xl mb-6 shadow-2xl shadow-primary/10 border border-slate-100 group transition-all hover:scale-105">
                        <Shield className="w-10 h-10 text-primary fill-primary/5" />
                    </div>
                    <h1 className="text-4xl font-extrabold text-primary tracking-tight mb-3">Martyn's Law RaaS</h1>
                    <p className="text-slate-500 font-medium">Authorised Compliance Port for Facility Auditors</p>
                </div>

                {/* Card */}
                <div className="bg-white border border-slate-200 p-12 rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] relative overflow-hidden">
                    <div className="absolute top-0 inset-x-0 h-1.5 bg-primary"></div>

                    {error && (
                        <div className="mb-8 p-5 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-4 text-red-700 text-sm font-bold animate-in slide-in-from-top-4">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-8">
                        <div>
                            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 ml-1">Auditor Identification</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-primary font-bold placeholder-slate-300 focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all text-lg shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]"
                                placeholder="Enter username"
                                required
                            />
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-3 px-1">
                                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Secure Passcode</label>
                                <a href="#" className="text-[10px] font-extrabold text-primary uppercase tracking-widest hover:underline">Reset Logic</a>
                            </div>
                            <div className="relative">
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-primary font-bold placeholder-slate-300 focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all text-lg shadow-[inset_0_2_4px_rgba(0,0,0,0.02)]"
                                    placeholder="••••••••"
                                    required
                                />
                                <Lock className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                            </div>
                        </div>

                        <div className="flex items-center text-xs px-1">
                            <label className="flex items-center gap-3 text-slate-500 font-bold cursor-pointer group">
                                <input type="checkbox" className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary/20 cursor-pointer" />
                                <span className="group-hover:text-primary transition-colors">Maintain Active Session</span>
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-primary hover:bg-primary/95 text-white font-extrabold py-5 rounded-2xl transition-all shadow-2xl shadow-primary/20 flex items-center justify-center gap-3 disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none hover:scale-[1.01] text-xl"
                        >
                            {isLoading ? 'Verifying Credentials...' : 'Authenticate'}
                            {!isLoading && <ArrowRight className="w-6 h-6" />}
                        </button>
                    </form>
                </div>

                <div className="mt-12 text-center">
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">
                        New Organization? <a href="/signup" className="text-primary hover:underline ml-2">Request Onboarding</a>
                    </p>
                </div>
            </div>
        </div>
    );
}
