import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { Shield, Lock, ArrowRight, Video, CheckCircle, AlertCircle, Mail } from 'lucide-react';
import '../app/globals.css';

export default function Register() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        setIsLoading(true);

        try {
            const res = await fetch(`${API_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (res.ok) {
                // Success - Redirect to Login
                router.push('/login?registered=true');
            } else {
                setError(data.error || 'Registration failed');
            }
        } catch (err) {
            console.error(err);
            setError('Network error. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans selection:bg-primary/20 selection:text-primary">
            <Head>
                <title>Auditor Registration | RaaS Platform</title>
            </Head>

            {/* Background Elements */}
            <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none"></div>

            <div className="w-full max-w-lg relative z-10">

                {/* Header */}
                <div className="text-center mb-10">
                    <Link href="/" className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl mb-6 shadow-xl shadow-primary/10 border border-slate-100 hover:scale-105 transition-all">
                        <Shield className="w-8 h-8 text-primary fill-primary/5" />
                    </Link>
                    <h1 className="text-3xl font-extrabold text-primary tracking-tight mb-2">Create Auditor Account</h1>
                    <p className="text-slate-500 font-medium text-sm">Join the authorized Martyn's Law compliance network.</p>
                </div>

                {/* Form Card */}
                <div className="bg-white border border-slate-200 p-10 rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] relative overflow-hidden">

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700 text-sm font-bold animate-in slide-in-from-top-2">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleRegister} className="space-y-6">
                        <div>
                            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2 ml-1">Official Email Address</label>
                            <div className="relative">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-6 pr-12 py-4 text-primary font-bold placeholder-slate-300 focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all shadow-inner"
                                    placeholder="name@organization.com"
                                    required
                                />
                                <Mail className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2 ml-1">Secure Passcode</label>
                            <div className="relative">
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-6 pr-12 py-4 text-primary font-bold placeholder-slate-300 focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all shadow-inner"
                                    placeholder="At least 8 characters"
                                    required
                                />
                                <Lock className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2 ml-1">Confirm Passcode</label>
                            <div className="relative">
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-6 pr-12 py-4 text-primary font-bold placeholder-slate-300 focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all shadow-inner"
                                    placeholder="Repeat passcode"
                                    required
                                />
                                <CheckCircle className={`absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${password && password === confirmPassword ? 'text-emerald-500' : 'text-slate-200'}`} />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-primary hover:bg-primary/95 text-white font-extrabold py-5 rounded-2xl transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3 disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none hover:scale-[1.01] mt-2"
                        >
                            {isLoading ? 'Creating Account...' : 'Register Organization'}
                            {!isLoading && <ArrowRight className="w-5 h-5" />}
                        </button>
                    </form>
                </div>

                <div className="mt-10 text-center">
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">
                        Already have access? <Link href="/login" className="text-primary hover:underline ml-2">Log In Here</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
