'use client';
import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Check, ArrowRight, Shield, Video, FileText } from 'lucide-react';
import AiScannerDemo from '../../components/marketing/AiScannerDemo';
import CostBenefitVisualizer from '../../components/marketing/CostBenefitVisualizer';
import TierChecker from '../../components/marketing/TierChecker';

export default function MarketingPage() {
    return (
        <main className="min-h-screen bg-slate-950 text-slate-100 selection:bg-blue-500 selection:text-white">



            {/* --- HERO SECTION --- */}
            <section className="relative pt-32 pb-20 px-4 overflow-hidden">
                <div className="max-w-5xl mx-auto text-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="inline-block mb-4 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-xs font-bold uppercase tracking-wider"
                    >
                        Martyn's Law Compliance Engine
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-500"
                    >
                        Compliance in a<br /> <span className="text-blue-500">Walkthrough.</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="text-xl md:text-2xl text-slate-400 mb-10 max-w-2xl mx-auto"
                    >
                        Point your camera. Secure your venue. Sleep soundly knowing you've met your Section 27 duties.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="flex justify-center gap-4"
                    >
                        <Link href="#check-tier" className="bg-white text-slate-900 hover:bg-slate-200 font-bold px-8 py-4 rounded-lg text-lg transition-all flex items-center gap-2">
                            Check My Venue <ArrowRight className="w-5 h-5" />
                        </Link>
                    </motion.div>
                </div>

                {/* Background Glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none"></div>
            </section>

            {/* --- FEATURE 1: TERMINATOR VISION --- */}
            <section className="py-24 bg-slate-900/50 relative">
                <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
                    <div className="order-2 md:order-1">
                        <AiScannerDemo />
                    </div>
                    <div className="order-1 md:order-2">
                        <div className="w-12 h-12 bg-emerald-500/10 rounded-lg flex items-center justify-center mb-6">
                            <Video className="text-emerald-500" />
                        </div>
                        <h2 className="text-3xl font-bold mb-4">See Risks. Instantly.</h2>
                        <p className="text-slate-400 text-lg mb-6">
                            Forget clipboards. Our AI scans your venue in real-time, identifying blocked exits, hostile vehicle vectors, and crowd density hazards.
                        </p>
                        <ul className="space-y-3">
                            {['Computer Vision Threat Detection', 'Automatic "Digital Thread" Receipt', 'Evidence-Based Auditing'].map((item) => (
                                <li key={item} className="flex items-center gap-3 text-slate-300">
                                    <Check className="w-5 h-5 text-emerald-500" /> {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </section>

            {/* --- FEATURE 2: REASONABLY PRACTICABLE --- */}
            <section className="py-24 bg-slate-950">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="text-center mb-16 max-w-2xl mx-auto">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">You Don't Need Bank-Vault Security.</h2>
                        <p className="text-slate-400 text-lg">
                            The law only asks for what is "Reasonably Practicable." Our SMT-LIB logic engine proves exactly what you can afford—and protects you from overspending.
                        </p>
                    </div>

                    <CostBenefitVisualizer />
                </div>
            </section>

            {/* --- START JOURNEY SECTION (Replaced Tier Checker focus) --- */}
            <section id="start-journey" className="py-24 relative overflow-hidden bg-slate-900">
                <div className="max-w-4xl mx-auto px-4 relative z-10 text-center">
                    <h2 className="text-4xl font-bold mb-6">Start Your Compliance Journey</h2>
                    <p className="text-slate-400 mb-10 text-lg">
                        Ready to secure your venue? Begin your self-assessment or check your regulation tier below.
                    </p>

                    {/* Primary CTA */}
                    <div className="mb-16">
                        <Link href="/dashboard" className="inline-flex items-center gap-3 bg-blue-600 hover:bg-blue-500 text-white font-bold px-10 py-5 rounded-2xl text-xl transition-all shadow-xl shadow-blue-600/20 hover:scale-105">
                            <Shield className="w-6 h-6" /> Start Video Assessment
                        </Link>
                        <p className="mt-4 text-slate-500 text-sm">No credit card required for initial scan.</p>
                    </div>

                    {/* Tier Checker Helper */}
                    <div className="bg-slate-950/50 border border-white/5 rounded-3xl p-8 backdrop-blur-sm">
                        <h3 className="text-xl font-bold mb-4 text-slate-300">Not sure if the law applies to you?</h3>
                        <p className="text-slate-500 mb-6 text-sm">Check your tier status in 30 seconds:</p>
                        <TierChecker />
                    </div>
                </div>

                {/* Background Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-blue-900/10"></div>
            </section>

            {/* --- TRUST SIGNALS --- */}
            <section className="py-12 border-t border-white/10 bg-black/20">
                <div className="max-w-7xl mx-auto px-4 flex flex-wrap justify-center gap-8 md:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                    <div className="flex items-center gap-2 font-bold text-lg"><Shield className="w-6 h-6" /> Home Office Aligned</div>
                    <div className="flex items-center gap-2 font-bold text-lg"><FileText className="w-6 h-6" /> Section 27 Ready</div>
                    <div className="flex items-center gap-2 font-bold text-lg"><Check className="w-6 h-6" /> GDPR Compliant</div>
                </div>
            </section>

            {/* --- FOOTER --- */}
            <footer className="py-12 text-slate-600 text-center text-sm">
                <p>&copy; 2026 Resilience as a Service (RaaS). All rights reserved.</p>
            </footer>
        </main>
    );
}
