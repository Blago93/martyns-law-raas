'use client';
import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Smartphone, FileText, CheckCircle, Brain, Lock, Server } from 'lucide-react';

export default function FeaturesPage() {
    return (
        <main className="min-h-screen bg-slate-950 text-slate-100 pt-32 pb-20">

            {/* HERO */}
            <section className="text-center max-w-4xl mx-auto px-4 mb-32">
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6"
                >
                    How it Works
                </motion.h1>
                <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                    Compliance doesn't have to be a headache. RaaS turns a 3-month consultancy project into a 30-minute walkthrough.
                </p>
            </section>

            {/* STEP 1 */}
            <StepSection
                number="01"
                title="Scan Your Venue"
                desc="Use our dedicated mobile web app to walk the perimeter of your site. Our AI Vision engine automatically identifies 50+ types of vulnerabilities, from blocked fire exits to unmitigated vehicle ramming points."
                icon={<Smartphone className="w-8 h-8" />}
                align="left"
            />

            {/* STEP 2 */}
            <StepSection
                number="02"
                title="AI Risk Assessment"
                desc="Our 'Digital Reasoning' engine (powered by SMT-LIB logic) processes the scan data. It balances security needs against your budget constraints to calculate 'Reasonably Practicable' mitigations—exactly as the law requires."
                icon={<Brain className="w-8 h-8" />}
                align="right"
            />

            {/* STEP 3 */}
            <StepSection
                number="03"
                title="Generate & Submit"
                desc="With one click, create a 20-page PDF report that is legally compliant with Section 27 of the Terrorism (Protection of Premises) Bill. Send it directly to the Regulator via our secure API integration."
                icon={<FileText className="w-8 h-8" />}
                align="left"
            />

            {/* TECH GRID */}
            <section className="max-w-7xl mx-auto px-4 py-24 bg-slate-900/30 mt-24 rounded-3xl">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold mb-4">Under the Hood</h2>
                    <p className="text-slate-400">Enterprise-grade technology protecting your data.</p>
                </div>
                <div className="grid md:grid-cols-3 gap-8">
                    <TechCard
                        icon={<Lock />}
                        title="End-to-End Encryption"
                        desc="Your venue blueprints and security plans are encrypted at rest and in transit using AES-256."
                    />
                    <TechCard
                        icon={<Server />}
                        title="UK Data Sovereignty"
                        desc="All data is hosted physically within the UK (London Region) to comply with strict GDPR and government standards."
                    />
                    <TechCard
                        icon={<CheckCircle />}
                        title="Audit Trails"
                        desc="Every action is logged on an immutable ledger. If an incident occurs, you can prove exactly what you knew and when."
                    />
                </div>
            </section>

            <section className="text-center mt-24">
                <Link href="/signup" className="bg-white text-slate-950 font-bold px-8 py-4 rounded-full hover:bg-slate-200 transition-colors text-lg">
                    Start My Free Scan
                </Link>
            </section>

        </main>
    );
}

function StepSection({ number, title, desc, icon, align }: { number: string, title: string, desc: string, icon: React.ReactNode, align: 'left' | 'right' }) {
    return (
        <section className="max-w-6xl mx-auto px-4 mb-32">
            <div className={`flex flex-col md:flex-row items-center gap-12 ${align === 'right' ? 'md:flex-row-reverse' : ''}`}>

                {/* TEXT */}
                <motion.div
                    initial={{ opacity: 0, x: align === 'left' ? -50 : 50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    className="flex-1"
                >
                    <div className="text-6xl font-black text-slate-800 mb-4">{number}</div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-600/20">
                            {icon}
                        </div>
                        <h2 className="text-3xl font-bold">{title}</h2>
                    </div>
                    <p className="text-xl text-slate-400 leading-relaxed">
                        {desc}
                    </p>
                </motion.div>

                {/* VISUAL (Placeholder for now) */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="flex-1 w-full"
                >
                    <div className="aspect-[4/3] bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl border border-white/5 flex items-center justify-center relative overflow-hidden group">
                        <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <span className="text-slate-600 font-mono text-sm">[Demo Visual: {title}]</span>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

function TechCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
    return (
        <div className="bg-slate-950 p-8 rounded-2xl border border-white/5">
            <div className="text-emerald-500 mb-4">{icon}</div>
            <h3 className="font-bold text-white mb-2">{title}</h3>
            <p className="text-sm text-slate-400">{desc}</p>
        </div>
    );
}
