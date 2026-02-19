import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Shield, ArrowRight, CheckCircle, AlertTriangle } from 'lucide-react';

export default function Questionnaire() {
    const router = useRouter();
    const [answers, setAnswers] = useState<Record<string, string>>({});

    const questions = [
        {
            id: 'lockdown_procedure',
            text: "Do you have a documented Lock-Down Procedure?",
            hint: "A plan for keeping people safe inside during an attack."
        },
        {
            id: 'act_training',
            text: "Have 80% of your staff completed ACT (Action Counters Terrorism) training?",
            hint: "Free online training from NaCTSO."
        },
        {
            id: 'search_policy',
            text: "Do you enforce a bag search policy at entry?",
            hint: "Checking bags for prohibited items."
        },
        {
            id: 'evacuation_signs',
            text: "Are evacuation routes clearly marked with illuminated signs?",
            hint: "Visible even in low light/power failure."
        },
        {
            id: 'cctv_monitoring',
            text: "Is your CCTV monitored in real-time during operating hours?",
            hint: "Active surveillance vs. just recording."
        }
    ];

    const handleAnswer = (id: string, value: string) => {
        setAnswers(prev => ({ ...prev, [id]: value }));
    };

    const handleFileUpload = (id: string, event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            // Convert to Base64 (Simple resizing could go here later)
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result as string;
                // Store evidence in localStorage immediately to keep state light
                localStorage.setItem(`raas_evidence_${id}`, base64);
                // Mark as having evidence
                setAnswers(prev => ({ ...prev, [`${id}_evidence`]: 'uploaded' }));
            };
            reader.readAsDataURL(file);
        }
    };

    const isComplete = questions.every(q => {
        const answer = answers[q.id];
        if (answer === 'yes') {
            return answers[`${q.id}_evidence`] === 'uploaded';
        }
        return answer !== undefined;
    });

    const handleContinue = () => {
        if (!isComplete) return;
        localStorage.setItem('raas_precheck', JSON.stringify(answers));
        router.push('/audit/record');
    };

    return (
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20 selection:text-primary">
            <Head>
                <title>Pre-Audit Check | RaaS Platform</title>
            </Head>

            {/* Header handled by Layout */}

            <main className="pt-32 pb-20 px-4 max-w-3xl mx-auto">

                <div className="mb-8">
                    <h1 className="text-3xl font-extrabold mb-2 flex items-center gap-3 text-primary tracking-tight">
                        <Shield className="text-primary fill-primary/10" /> Procedural Pre-Check
                    </h1>
                    <p className="text-slate-500 font-medium">
                        Before recording, let's establish your baseline procedural compliance.
                        Proof of documentation is required for verify "Yes" responses.
                    </p>
                </div>

                <div className="space-y-6">
                    {questions.map((q, index) => (
                        <div key={q.id} className="bg-white border border-slate-200 p-8 rounded-3xl transition-all shadow-sm hover:shadow-md hover:border-primary/20">
                            <div className="flex flex-col gap-6">
                                <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                                    <div className="flex-1">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Requirement {index + 1}</div>
                                        <h3 className="font-bold text-xl text-primary leading-tight">{q.text}</h3>
                                        <p className="text-sm text-slate-500 mt-2 font-medium">{q.hint}</p>
                                    </div>
                                    <div className="flex gap-2 shrink-0">
                                        <button
                                            onClick={() => handleAnswer(q.id, 'yes')}
                                            className={`px-8 py-2.5 rounded-xl font-bold border transition-all ${answers[q.id] === 'yes'
                                                ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm'
                                                : 'bg-white border-slate-200 hover:border-emerald-500 text-slate-500'
                                                }`}
                                        >
                                            Yes
                                        </button>
                                        <button
                                            onClick={() => handleAnswer(q.id, 'no')}
                                            className={`px-8 py-2.5 rounded-xl font-bold border transition-all ${answers[q.id] === 'no'
                                                ? 'bg-red-50 border-red-500 text-red-700 shadow-sm'
                                                : 'bg-white border-slate-200 hover:border-red-500 text-slate-500'
                                                }`}
                                        >
                                            No
                                        </button>
                                    </div>
                                </div>

                                {/* EVIDENCE UPLOAD SECTION */}
                                {answers[q.id] === 'yes' && (
                                    <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 border-dashed animate-in fade-in slide-in-from-top-4">
                                        <label className="flex items-center gap-4 cursor-pointer group">
                                            <div className="bg-white p-3 rounded-xl border border-slate-200 group-hover:border-primary/30 group-hover:bg-primary/5 transition-all shadow-sm">
                                                <AlertTriangle className={`w-5 h-5 ${answers[`${q.id}_evidence`] ? 'text-emerald-500 leading-none' : 'text-slate-400'}`} />
                                            </div>
                                            <div className="flex-1">
                                                <span className="text-sm font-bold text-slate-700 block">
                                                    {answers[`${q.id}_evidence`] ? '✅ Evidence Document Uploaded' : 'Upload Proof (Photo of Doc/Sign)'}
                                                </span>
                                                <span className="text-xs text-slate-500 font-medium tracking-tight">Maximum file size: 5MB (JPEG/PNG)</span>
                                            </div>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(e) => handleFileUpload(q.id, e)}
                                            />
                                            {!answers[`${q.id}_evidence`] && (
                                                <div className="bg-primary/5 text-primary text-[10px] font-bold px-3 py-1.5 rounded-full border border-primary/10">Browse</div>
                                            )}
                                        </label>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-12 flex justify-end">
                    <button
                        onClick={handleContinue}
                        disabled={!isComplete}
                        className={`
                            px-10 py-5 rounded-2xl font-bold text-lg flex items-center gap-3 shadow-xl transition-all
                            ${isComplete
                                ? 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/20 hover:scale-[1.02]'
                                : 'bg-slate-200 text-slate-400 cursor-not-allowed'}
                        `}
                    >
                        Start Video Assessment <ArrowRight className="w-5 h-5" />
                    </button>
                </div>

            </main>
        </div>
    );
}
