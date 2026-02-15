'use client';
import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Shield, BookOpen, Users, Target, Heart } from 'lucide-react';

export default function MissionPage() {
    return (
        <main className="min-h-screen bg-slate-950 text-slate-100 pt-32 pb-20">

            {/* HERO */}
            <section className="max-w-4xl mx-auto px-4 text-center mb-24">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-sm font-bold mb-8"
                >
                    <BookOpen className="w-4 h-4 fill-current" /> Official Legislation Aligned
                </motion.div>

                <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8">
                    Born from Tragedy.<br />
                    <span className="text-blue-500">Built for Safety.</span>
                </h1>
                <p className="text-xl text-slate-400 leading-relaxed">
                    Martyn's Law is not just legislation. It is a promise to keep public spaces safe.
                    Our mission is to make keeping that promise easy, affordable, and accurate for every venue owner.
                </p>
            </section>

            {/* THE STORY */}
            <section className="max-w-5xl mx-auto px-4 grid md:grid-cols-2 gap-16 items-center mb-32">
                <div className="relative">
                    <div className="absolute inset-0 bg-blue-600/20 blur-[100px] rounded-full"></div>
                    <img
                        src="/placeholder-campaign.jpg"
                        alt="Security Campaign"
                        className="relative z-10 rounded-2xl border border-white/10 shadow-2xl bg-slate-900 aspect-video object-cover"
                    />
                    {/* Note: In a real app we'd use a real image, using a placeholder div for now if image missing */}
                    <div className="absolute -bottom-6 -right-6 bg-slate-800 p-6 rounded-xl border border-white/10 shadow-xl z-20 max-w-xs">
                        <p className="text-sm text-slate-300 italic">"We cannot stop every attack, but we can reduce the impact."</p>
                        <p className="text-xs text-slate-500 mt-2 font-bold">- Figen Murray, CBE</p>
                    </div>
                </div>
                <div>
                    <h2 className="text-3xl font-bold mb-6">The Origin</h2>
                    <p className="text-slate-400 text-lg mb-6 leading-relaxed">
                        Following the tragic Manchester Arena attack in 2017, Figen Murray (mother of Martyn Hett) campaigned tirelessly for better security at public venues.
                    </p>
                    <p className="text-slate-400 text-lg mb-6 leading-relaxed">
                        The result is the <strong>Terrorism (Protection of Premises) Bill</strong>, known as "Martyn's Law." It ensures that security is no longer an afterthought, but a fundamental requirement for any venue holding 100+ people.
                    </p>
                    <div className="flex gap-4">
                        <div className="flex items-center gap-2 text-white font-bold">
                            <Users className="w-5 h-5 text-blue-500" /> Public Safety
                        </div>
                        <div className="flex items-center gap-2 text-white font-bold">
                            <BookOpen className="w-5 h-5 text-blue-500" /> Legislation
                        </div>
                    </div>
                </div>
            </section>

            {/* OUR ROLE */}
            <section className="bg-slate-900/50 py-24">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold mb-4">Why RaaS?</h2>
                        <p className="text-slate-400 max-w-2xl mx-auto">
                            Compliance shouldn't be confusing. We built the "Resilience as a Service" platform to bridge the gap between complex legislation and busy venue managers.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <ValueCard
                            icon={<Target />}
                            title="Precision"
                            desc="We don't guess. Our AI uses SMT-LIB logic to prove your security plan meets the exact letter of the law."
                        />
                        <ValueCard
                            icon={<Shield />}
                            title="Protection"
                            desc="We focus on 'Reasonably Practicable' measures. Secure your venue without bankrupting your business."
                        />
                        <ValueCard
                            icon={<BookOpen />}
                            title="Education"
                            desc="We don't just give you a certificate. We train your staff (the most important security asset)."
                        />
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="text-center py-24 px-4">
                <h2 className="text-4xl font-bold mb-8">Join the Movement</h2>
                <Link href="/signup" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-4 rounded-full text-lg transition-all shadow-lg shadow-blue-600/25">
                    Start Your Compliance Journey
                </Link>
            </section>

        </main>
    );
}

function ValueCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
    return (
        <div className="bg-slate-950 border border-white/5 p-8 rounded-2xl hover:border-blue-500/50 transition-colors group">
            <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-500 mb-6 group-hover:scale-110 transition-transform">
                {icon}
            </div>
            <h3 className="text-xl font-bold mb-3">{title}</h3>
            <p className="text-slate-400 leading-relaxed">{desc}</p>
        </div>
    );
}
