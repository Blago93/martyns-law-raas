'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, MapPin, Phone, MessageSquare, Send } from 'lucide-react';

export default function ContactPage() {
    const [formStatus, setFormStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setFormStatus('sending');
        // Simulate API call
        setTimeout(() => setFormStatus('sent'), 1500);
    };

    return (
        <main className="min-h-screen bg-slate-950 text-slate-100 pt-32 pb-20">

            <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-2 gap-16">

                {/* LEFT: INFO */}
                <div>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <h1 className="text-4xl md:text-5xl font-extrabold mb-6">Get in Touch</h1>
                        <p className="text-xl text-slate-400 mb-12">
                            Have questions about the platform? I am here to help.
                        </p>

                        <div className="space-y-8">
                            <ContactItem
                                icon={<Mail />}
                                title="Email Me Directly"
                                content="blago@raas-platform.co.uk"
                                delay={0.1}
                            />
                        </div>

                        <div className="mt-12 p-6 bg-blue-900/10 border border-blue-500/20 rounded-2xl">
                            <h3 className="font-bold flex items-center gap-2 mb-2">
                                <MessageSquare className="w-5 h-5 text-blue-500" /> Need a Demo?
                            </h3>
                            <p className="text-sm text-slate-400">
                                I can walk you through the platform personally via video call. Just drop me an email to schedule.
                            </p>
                        </div>
                    </motion.div>
                </div>

                {/* RIGHT: FORM */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-slate-900/50 p-8 rounded-3xl border border-white/5"
                >
                    {formStatus === 'sent' ? (
                        <div className="h-full flex flex-col items-center justify-center text-center py-20">
                            <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6">
                                <Send className="w-10 h-10 text-emerald-500" />
                            </div>
                            <h3 className="text-2xl font-bold mb-2">Message Sent!</h3>
                            <p className="text-slate-400">We'll get back to you within 24 hours.</p>
                            <button
                                onClick={() => setFormStatus('idle')}
                                className="mt-8 text-blue-400 hover:text-white transition-colors"
                            >
                                Send another message
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-400 mb-2">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                    placeholder="Jane Doe"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-400 mb-2">Email Address</label>
                                <input
                                    type="email"
                                    required
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                    placeholder="jane@venue.co.uk"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-400 mb-2">Subject</label>
                                <select className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors">
                                    <option>General Inquiry</option>
                                    <option>Technical Support</option>
                                    <option>Billing Question</option>
                                    <option>Partner/Press</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-400 mb-2">Message</label>
                                <textarea
                                    required
                                    rows={5}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors resize-none"
                                    placeholder="How can we help?"
                                ></textarea>
                            </div>

                            <button
                                type="submit"
                                disabled={formStatus === 'sending'}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {formStatus === 'sending' ? 'Sending...' : 'Send Message'}
                                {!formStatus && <Send className="w-4 h-4" />}
                            </button>
                        </form>
                    )}
                </motion.div>

            </div>
        </main>
    );
}

function ContactItem({ icon, title, content, delay }: { icon: React.ReactNode, title: string, content: string, delay: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay }}
            className="flex items-start gap-4"
        >
            <div className="p-3 bg-slate-800 rounded-lg text-slate-300">
                {icon}
            </div>
            <div>
                <h3 className="font-bold text-lg">{title}</h3>
                <p className="text-slate-400">{content}</p>
            </div>
        </motion.div>
    );
}
