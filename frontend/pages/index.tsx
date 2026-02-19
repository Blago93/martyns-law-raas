import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
    Shield,
    Brain,
    BarChart3,
    FileCheck,
    ArrowRight,
    CheckCircle2,
    Clock,
    Users,
    Building2,
    AlertTriangle,
    Scale,
    Upload,
    Cpu,
    FileText,
} from 'lucide-react';

/**
 * Landing page for RaaS Intelligence platform.
 * Light-themed, analytical design showcasing Martyn's Law compliance features.
 * @returns {JSX.Element} The landing page component.
 */
export default function LandingPage() {
    const router = useRouter();

    /** Platform feature cards data */
    const features = [
        {
            icon: Brain,
            title: 'AI-Powered Analysis',
            desc: 'Hybrid AI engine combines AWS Bedrock with expert rule-sets to deliver nuanced, context-aware risk scoring.',
            color: 'bg-blue-50 text-blue-600',
        },
        {
            icon: BarChart3,
            title: 'Real-Time Monitoring',
            desc: 'Continuous risk intelligence replaces point-in-time snapshots. Track threats as they evolve, not after the fact.',
            color: 'bg-emerald-50 text-emerald-600',
        },
        {
            icon: FileCheck,
            title: 'Defensible Reports',
            desc: 'Generate regulator-ready PDF reports instantly. Full audit trail ensures every recommendation is traceable.',
            color: 'bg-violet-50 text-violet-600',
        },
    ];

    /** How it works steps */
    const steps = [
        {
            icon: Upload,
            step: '01',
            title: 'Submit Venue Details',
            desc: 'Answer a guided questionnaire about your venue — capacity, layout, existing security measures, and event types.',
        },
        {
            icon: Cpu,
            step: '02',
            title: 'AI Risk Analysis',
            desc: 'Our Hybrid AI engine analyses your data against 180+ threat vectors, cross-referencing MI5 threat levels and local intelligence.',
        },
        {
            icon: FileText,
            step: '03',
            title: 'Receive Your Report',
            desc: 'Download a defensible, regulator-ready compliance report with scored risks, prioritised recommendations, and action plans.',
        },
    ];

    /** Martyn's Law key facts */
    const lawFacts = [
        {
            icon: Users,
            title: 'Who It Affects',
            text: 'All publicly accessible venues and events with capacity of 100+ people across the UK.',
        },
        {
            icon: Building2,
            title: 'Two Tiers',
            text: 'Standard Tier (100-799 capacity): basic procedures. Enhanced Tier (800+): full risk assessments and security plans.',
        },
        {
            icon: Scale,
            title: 'Legal Obligation',
            text: 'Venue operators must conduct terrorism risk assessments and implement "reasonably practicable" protective security measures.',
        },
        {
            icon: Clock,
            title: 'Timeline',
            text: 'Royal Assent received. Venues have a 24-month implementation period to achieve full compliance.',
        },
    ];

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
            <Head>
                <title>RaaS Intelligence | Martyn&apos;s Law Compliance Platform</title>
                <meta
                    name="description"
                    content="AI-powered Martyn's Law risk assessments. Automated, defensible compliance intelligence for UK venues and events."
                />
            </Head>

            {/* ─── NAVIGATION ─── */}
            <nav className="fixed w-full z-50 bg-white/90 backdrop-blur-md border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Shield className="w-7 h-7 text-blue-600" />
                        <span className="text-lg font-bold tracking-tight text-slate-900">
                            RaaS{' '}
                            <span className="text-blue-600">Intelligence</span>
                        </span>
                    </div>
                    <div className="hidden md:flex gap-8 text-sm font-medium text-slate-500">
                        <a href="#features" className="hover:text-blue-600 transition-colors">Features</a>
                        <a href="#how-it-works" className="hover:text-blue-600 transition-colors">How It Works</a>
                        <a href="#martyns-law" className="hover:text-blue-600 transition-colors">Martyn&apos;s Law</a>
                        <a href="#pricing" className="hover:text-blue-600 transition-colors">Pricing</a>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => router.push('/login')}
                            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
                        >
                            Log In
                        </button>
                        <button
                            onClick={() => router.push('/register')}
                            className="px-5 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                        >
                            Get Started
                        </button>
                    </div>
                </div>
            </nav>

            {/* ─── HERO SECTION ─── */}
            <section className="pt-28 pb-20 px-6 bg-gradient-to-b from-white via-blue-50/30 to-slate-50">
                <div className="max-w-7xl mx-auto">
                    <div className="max-w-3xl mx-auto text-center space-y-6">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold tracking-wide uppercase">
                            <Shield className="w-3.5 h-3.5" />
                            Protect Duty Compliance Platform
                        </div>
                        <h1 className="text-4xl md:text-6xl font-extrabold leading-tight tracking-tight text-slate-900">
                            Intelligent Risk Analysis{' '}
                            <span className="text-blue-600">as a Service</span>
                        </h1>
                        <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
                            Automate your Martyn&apos;s Law compliance with AI-driven risk assessments.
                            Transform static security audits into dynamic, defensible intelligence.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                            <button
                                onClick={() => router.push('/register')}
                                className="px-8 py-3.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all shadow-md shadow-blue-600/25 flex items-center justify-center gap-2"
                            >
                                Start Free Assessment <ArrowRight className="w-4 h-4" />
                            </button>
                            <button className="px-8 py-3.5 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-white hover:border-slate-400 transition-all">
                                View Sample Report
                            </button>
                        </div>
                    </div>

                    {/* Stats Bar */}
                    <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
                        {[
                            { value: '2,500+', label: 'Venues Assessed' },
                            { value: '180+', label: 'Threat Vectors' },
                            { value: '< 5 min', label: 'Report Generation' },
                            { value: '99.7%', label: 'Compliance Rate' },
                        ].map((stat, i) => (
                            <div key={i} className="text-center p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                                <div className="text-2xl font-bold text-blue-600">{stat.value}</div>
                                <div className="text-xs text-slate-500 font-medium uppercase tracking-wide mt-1">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── FEATURES ─── */}
            <section id="features" className="py-24 px-6 bg-white">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
                            Platform Capabilities
                        </h2>
                        <p className="mt-4 text-lg text-slate-500 max-w-2xl mx-auto">
                            Purpose-built for Martyn&apos;s Law compliance — combining AI intelligence with security expertise.
                        </p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        {features.map((feature, idx) => (
                            <div
                                key={idx}
                                className="p-8 rounded-2xl bg-slate-50 border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 group"
                            >
                                <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                                    <feature.icon className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                                <p className="text-slate-500 leading-relaxed">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── HOW IT WORKS ─── */}
            <section id="how-it-works" className="py-24 px-6 bg-slate-50">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
                            How It Works
                        </h2>
                        <p className="mt-4 text-lg text-slate-500 max-w-2xl mx-auto">
                            From venue data to defensible compliance report in three simple steps.
                        </p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        {steps.map((step, idx) => (
                            <div key={idx} className="relative">
                                <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm h-full">
                                    <div className="text-5xl font-extrabold text-blue-100 mb-4">{step.step}</div>
                                    <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center mb-4">
                                        <step.icon className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 mb-2">{step.title}</h3>
                                    <p className="text-slate-500 text-sm leading-relaxed">{step.desc}</p>
                                </div>
                                {/* Connector arrow (hidden on last item) */}
                                {idx < 2 && (
                                    <div className="hidden md:flex absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                                        <ArrowRight className="w-8 h-8 text-blue-300" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── MARTYN'S LAW INFO BOARD ─── */}
            <section id="martyns-law" className="py-24 px-6 bg-white">
                <div className="max-w-7xl mx-auto">
                    <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl p-8 md:p-12 text-white overflow-hidden relative">
                        {/* Subtle decorative element */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>

                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-2">
                                <AlertTriangle className="w-6 h-6 text-amber-300" />
                                <span className="text-sm font-semibold text-blue-200 uppercase tracking-wider">Regulatory Update</span>
                            </div>
                            <h2 className="text-3xl md:text-4xl font-bold mb-4">
                                Martyn&apos;s Law — The Terrorism (Protection of Premises) Act
                            </h2>
                            <p className="text-blue-100 text-lg max-w-3xl leading-relaxed mb-10">
                                Named after Martyn Hett, who lost his life in the 2017 Manchester Arena attack,
                                this landmark legislation — also known as <strong>&quot;Protect Duty&quot;</strong> —
                                requires all qualifying public venues and events to assess terrorism risks and implement
                                proportionate security measures. Non-compliance carries significant penalties.
                            </p>

                            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                {lawFacts.map((fact, idx) => (
                                    <div key={idx} className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/10">
                                        <fact.icon className="w-8 h-8 text-blue-200 mb-3" />
                                        <h4 className="font-bold text-white mb-2">{fact.title}</h4>
                                        <p className="text-blue-100 text-sm leading-relaxed">{fact.text}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-10 flex flex-col sm:flex-row gap-4">
                                <button
                                    onClick={() => router.push('/register')}
                                    className="px-8 py-3.5 bg-white text-blue-700 font-semibold rounded-lg hover:bg-blue-50 transition-all flex items-center justify-center gap-2 shadow-lg"
                                >
                                    Check Your Compliance <ArrowRight className="w-4 h-4" />
                                </button>
                                <button className="px-8 py-3.5 border border-white/30 text-white font-medium rounded-lg hover:bg-white/10 transition-all">
                                    Download Guide (PDF)
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── TRUST / WHY US ─── */}
            <section className="py-20 px-6 bg-slate-50 border-t border-slate-200">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-slate-900">Why Choose RaaS Intelligence</h2>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-6">
                        {[
                            'Hybrid AI combining AWS Bedrock + expert security rules',
                            'UK-sovereign data infrastructure — full GDPR compliance',
                            'Audit-trail for every AI recommendation (explainable AI)',
                            'Reports aligned with SIA and NaCTSO guidance frameworks',
                            'Continuous monitoring — not point-in-time snapshots',
                            'Built specifically for Protect Duty / Martyn\'s Law',
                        ].map((item, idx) => (
                            <div key={idx} className="flex items-start gap-3 p-4 bg-white rounded-xl border border-slate-200">
                                <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                                <span className="text-slate-700 font-medium">{item}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── CTA SECTION ─── */}
            <section className="py-20 px-6 bg-white">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                        Ready to Secure Your Venue?
                    </h2>
                    <p className="text-lg text-slate-500 mb-8 max-w-2xl mx-auto">
                        Get your AI-powered risk assessment in under 5 minutes. No credit card required.
                    </p>
                    <button
                        onClick={() => router.push('/register')}
                        className="px-10 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/25 text-lg"
                    >
                        Start Free Assessment
                    </button>
                </div>
            </section>

            {/* ─── FOOTER ─── */}
            <footer className="py-10 px-6 border-t border-slate-200 bg-slate-50">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-blue-600" />
                        <span className="text-sm font-semibold text-slate-700">RaaS Intelligence</span>
                    </div>
                    <p className="text-sm text-slate-400">
                        &copy; {new Date().getFullYear()} RaaS Intelligence Ltd. Built for Martyn&apos;s Law Compliance.
                    </p>
                    <div className="flex gap-6 text-sm text-slate-500">
                        <a href="#" className="hover:text-blue-600 transition-colors">Privacy</a>
                        <a href="#" className="hover:text-blue-600 transition-colors">Terms</a>
                        <a href="#" className="hover:text-blue-600 transition-colors">Contact</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
