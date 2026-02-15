'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Check, X, Shield, Star, Zap, HelpCircle } from 'lucide-react';

export default function PricingPage() {
    const [isAnnual, setIsAnnual] = useState(true);

    const plans = [
        {
            name: 'Standard Tier',
            description: 'For venues under 800 capacity. Essential compliance.',
            price: isAnnual ? '£19' : '£29',
            period: isAnnual ? '/mo (billed annually)' : '/mo',
            features: [
                'Basic Security Plan Template',
                'Staff Training Modules (Basic)',
                '1 User License',
                'Email Support',
                'SIA Self-Submission Tool'
            ],
            notIncluded: [
                'AI Threat Scanning',
                'Automated "Reasonably Practicable" Audit',
                'Crowd Dynamics Analysis',
                'Dedicated Account Manager'
            ],
            cta: 'Start Standard Plan',
            popular: false,
            gradient: 'from-slate-700 to-slate-900'
        },
        {
            name: 'Enhanced Tier',
            description: 'For venues 800+ capacity. Advanced AI protection.',
            price: isAnnual ? '£89' : '£119',
            period: isAnnual ? '/mo (billed annually)' : '/mo',
            features: [
                'EVERYTHING in Standard',
                'AI Video Threat Detection',
                'Automated Compliance Reports',
                'Unlimited User Licenses',
                'Priority 24/7 Support',
                'Direct SIA Integration API'
            ],
            notIncluded: [],
            cta: 'Get Enhanced Protection',
            popular: true,
            gradient: 'from-blue-600 to-blue-900'
        }
    ];

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 pt-32 pb-20">

            {/* HERDER */}
            <div className="text-center max-w-3xl mx-auto px-4 mb-16">
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-500"
                >
                    Simple, Transparent Pricing.
                </motion.h1>
                <p className="text-xl text-slate-400">
                    Compliant security shouldn't break the bank. Choose the plan that fits your venue size.
                </p>

                {/* TOGGLE */}
                <div className="flex items-center justify-center mt-8 gap-4">
                    <span className={`text-sm font-bold ${!isAnnual ? 'text-white' : 'text-slate-500'}`}>Monthly</span>
                    <button
                        onClick={() => setIsAnnual(!isAnnual)}
                        className="w-16 h-8 bg-slate-800 rounded-full p-1 relative transition-colors duration-300 border border-slate-700 hover:border-blue-500"
                    >
                        <motion.div
                            layout
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            className={`w-6 h-6 bg-blue-500 rounded-full shadow-lg ${isAnnual ? 'ml-8' : 'ml-0'}`}
                        />
                    </button>
                    <span className={`text-sm font-bold ${isAnnual ? 'text-white' : 'text-slate-500'}`}>
                        Yearly <span className="text-emerald-400 text-xs ml-1">(Save 20%)</span>
                    </span>
                </div>
            </div>

            {/* CARDS */}
            <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-2 gap-8 mb-24">
                {plans.map((plan, index) => (
                    <motion.div
                        key={plan.name}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`relative rounded-2xl p-8 border border-white/10 overflow-hidden group hover:border-blue-500/50 transition-all duration-300 bg-gradient-to-br ${plan.gradient} bg-opacity-20 backdrop-blur-sm`}
                    >
                        {plan.popular && (
                            <div className="absolute top-4 right-4 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                                <Star className="w-3 h-3 fill-white" /> Most Popular
                            </div>
                        )}

                        <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                        <p className="text-slate-400 mb-6 h-12">{plan.description}</p>

                        <div className="mb-8">
                            <span className="text-5xl font-extrabold">{plan.price}</span>
                            <span className="text-slate-400">{plan.period}</span>
                        </div>

                        <Link
                            href="/signup"
                            className={`block w-full py-4 rounded-xl font-bold text-center transition-all ${plan.popular
                                    ? 'bg-blue-500 hover:bg-blue-400 text-white shadow-lg shadow-blue-500/25'
                                    : 'bg-white/10 hover:bg-white/20 text-white'
                                }`}
                        >
                            {plan.cta}
                        </Link>

                        <div className="mt-8 space-y-4">
                            <p className="text-sm font-bold text-slate-300 uppercase tracking-wider">Features</p>
                            {plan.features.map(feature => (
                                <div key={feature} className="flex items-start gap-3">
                                    <div className="mt-1 min-w-[20px]"><Check className="w-5 h-5 text-emerald-400" /></div>
                                    <span className="text-slate-300">{feature}</span>
                                </div>
                            ))}
                            {plan.notIncluded.map(feature => (
                                <div key={feature} className="flex items-start gap-3 opacity-40">
                                    <div className="mt-1 min-w-[20px]"><X className="w-5 h-5 text-slate-500" /></div>
                                    <span className="text-slate-500">{feature}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* FAQ SECTION */}
            <div className="max-w-3xl mx-auto px-4">
                <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>

                <div className="space-y-6">
                    <FAQItem
                        question="Do I need the Enhanced Tier?"
                        answer="If your venue capacity is over 800, Martyn's Law legally requires you to have an 'Enhanced Tier' plan. For smaller venues, the Standard plan is sufficient."
                    />
                    <FAQItem
                        question="Can I upgrade later?"
                        answer="Yes! You can switch from Standard to Enhanced at any time. We will prorate your payment for the remainder of the month."
                    />
                    <FAQItem
                        question="What happens if I don't comply?"
                        answer="Non-compliance can result in significant fines and potential closure orders. Our tool creates the audit trail you need to prove you took 'reasonably practicable' steps."
                    />
                </div>
            </div>

        </div>
    );
}

function FAQItem({ question, answer }: { question: string, answer: string }) {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div
            onClick={() => setIsOpen(!isOpen)}
            className="border border-white/10 rounded-xl p-6 cursor-pointer hover:bg-white/5 transition-colors"
        >
            <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg">{question}</h3>
                <motion.div animate={{ rotate: isOpen ? 180 : 0 }}>
                    <HelpCircle className="w-5 h-5 text-slate-400" />
                </motion.div>
            </div>
            {isOpen && (
                <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 text-slate-400 leading-relaxed"
                >
                    {answer}
                </motion.p>
            )}
        </div>
    );
}
