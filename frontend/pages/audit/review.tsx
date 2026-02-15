import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import MarketingHeader from '../../components/marketing/Header';
import { Shield, AlertTriangle, CheckCircle, XCircle, FileText, ChevronRight, Lock, Play, Camera, Loader2 } from 'lucide-react';
import mockData from '../../data/mock_assessment.json';

interface Finding {
    id: string;
    type: string;
    description: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    timestamp: string;
    status: 'PENDING_REVIEW' | 'VALIDATED' | 'OVERRIDDEN';
    justification?: string;
    mitigation?: string; // Added from AI
    reasonably_practicable?: boolean; // Added from AI
}

export default function ReviewAudit() {
    const router = useRouter();
    const [findings, setFindings] = useState<Finding[]>([]);
    const [activeFinding, setActiveFinding] = useState<Finding | null>(null);
    const [showOverrideModal, setShowOverrideModal] = useState(false);
    const [overrideText, setOverrideText] = useState('');
    const [digitalThreadId, setDigitalThreadId] = useState<string | null>(null);
    const [userEmail, setUserEmail] = useState('');

    // AI Analysis State
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Load initial mock data (or empty if we want to start fresh)
        // For now, let's keep mock data but allow adding to it
        setFindings(mockData.findings as Finding[]);
        setActiveFinding(mockData.findings[0] as Finding);

        const storedHash = localStorage.getItem('DigitalThreadStart');
        if (storedHash) {
            setDigitalThreadId(`${storedHash.substring(0, 8).toUpperCase()}-${storedHash.substring(storedHash.length - 4).toUpperCase()}`);
        }
    }, []);

    const handleAccept = (id: string) => {
        setFindings(prev => prev.map(f =>
            f.id === id ? { ...f, status: 'VALIDATED' } : f
        ));
        const idx = findings.findIndex(f => f.id === id);
        if (idx < findings.length - 1) setActiveFinding(findings[idx + 1]);
    };

    const handleOverrideClick = () => {
        setShowOverrideModal(true);
        setOverrideText('');
    };

    const submitOverride = () => {
        if (!activeFinding || !overrideText.trim()) return;
        setFindings(prev => prev.map(f =>
            f.id === activeFinding.id ? {
                ...f,
                status: 'OVERRIDDEN',
                severity: 'LOW',
                justification: overrideText
            } : f
        ));
        setShowOverrideModal(false);
        const idx = findings.findIndex(f => f.id === activeFinding.id);
        if (idx < findings.length - 1) setActiveFinding(findings[idx + 1]);
    };

    const handleSubmitToSIA = () => {
        if (!userEmail.trim()) {
            alert('Please enter your email address to receive the report.');
            return;
        }

        // Generate PDF using jsPDF
        const { jsPDF } = require('jspdf');
        const doc = new jsPDF();

        // Add content to PDF
        doc.setFontSize(20);
        doc.text('Martyn\'s Law Compliance Report', 20, 20);

        doc.setFontSize(12);
        doc.text(`Digital Thread ID: ${digitalThreadId || 'N/A'}`, 20, 35);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 45);
        doc.text(`Report will be sent to: ${userEmail}`, 20, 55);

        doc.setFontSize(14);
        doc.text('Findings Summary:', 20, 70);

        let yPos = 85;
        findings.forEach((finding, index) => {
            if (yPos > 270) {
                doc.addPage();
                yPos = 20;
            }
            doc.setFontSize(10);
            doc.text(`${index + 1}. ${finding.type} - ${finding.severity}`, 20, yPos);
            doc.text(`   Status: ${finding.status}`, 20, yPos + 5);
            yPos += 15;
        });

        // Download PDF
        doc.save(`compliance-report-${digitalThreadId || 'draft'}.pdf`);

        alert(`PDF downloaded successfully!\n\nA copy will be sent to: ${userEmail}\n\n(Email functionality will be implemented in production)`);
        router.push('/dashboard');
    };

    // --- AI ANALYSIS LOGIC ---
    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsAnalyzing(true);

        // Prepare Form Data
        const formData = new FormData();
        formData.append('frame', file);
        formData.append('venue', JSON.stringify({ name: "Manchester Arena", capacity: 21000 })); // Dynamic later

        try {
            // Call Backend
            const res = await fetch('http://localhost:3001/api/audit/analyze', {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) throw new Error("Analysis failed");

            const json = await res.json();
            const aiResult = json.data;

            // Create new finding from AI result
            const newFinding: Finding = {
                id: `ai-${Date.now()}`,
                type: aiResult.hazard_type || "Unknown Hazard",
                description: aiResult.description || "AI analysis completed.",
                severity: aiResult.severity as any || "MEDIUM",
                timestamp: new Date().toLocaleTimeString(),
                status: 'PENDING_REVIEW',
                mitigation: aiResult.mitigation,
                reasonably_practicable: aiResult.reasonably_practicable
            };

            setFindings(prev => [newFinding, ...prev]);
            setActiveFinding(newFinding);
            alert("✅ AI Analysis Complete!\n\nNew finding added to the top of the list.");

        } catch (error) {
            console.error(error);
            alert("❌ AI Analysis Failed. Check backend console.");
        } finally {
            setIsAnalyzing(false);
            if (fileInputRef.current) fileInputRef.current.value = ''; // Reset input
        }
    };

    const triggerUpload = () => fileInputRef.current?.click();

    const allReviewed = findings.every(f => f.status !== 'PENDING_REVIEW');

    const severityColor = (sev: string) => {
        switch (sev) {
            case 'CRITICAL': return 'bg-red-500/20 text-red-400 border-red-500/30';
            case 'HIGH': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
            case 'MEDIUM': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
            default: return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-blue-500 selection:text-white">
            <Head>
                <title>Audit Review | RaaS</title>
            </Head>

            <MarketingHeader />

            <main className="pt-32 pb-20 px-4 max-w-7xl mx-auto">

                {/* HEADER */}
                <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-2">
                            <Shield className="text-blue-500" /> Compliance Review
                        </h1>
                        <p className="text-slate-400 text-sm mt-1">Validate AI findings before submission.</p>
                    </div>
                    <div className="flex gap-4">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            className="hidden"
                            accept="image/*"
                        />
                        <button
                            onClick={triggerUpload}
                            disabled={isAnalyzing}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-600/20"
                        >
                            {isAnalyzing ? <Loader2 className="animate-spin w-4 h-4" /> : <Camera className="w-4 h-4" />}
                            {isAnalyzing ? "Analyzing Frame..." : "Analyze Live Evidence"}
                        </button>
                        <div className="bg-slate-900 border border-white/10 px-4 py-2 rounded-lg flex items-center gap-2 font-mono text-xs hidden md:flex">
                            <Lock className="w-3 h-3 text-emerald-500" />
                            <span className="text-slate-500">Thread ID:</span>
                            <span className="text-emerald-400 font-bold">{digitalThreadId || 'LOADING...'}</span>
                        </div>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">

                    {/* LEFT: LIST */}
                    <div className="lg:col-span-1 bg-slate-900/50 border border-white/5 rounded-3xl overflow-hidden flex flex-col h-[600px]">
                        <div className="p-4 border-b border-white/5 bg-slate-900/80">
                            <h3 className="font-bold text-sm text-slate-400 uppercase tracking-wider">Detected Risks ({findings.length})</h3>
                        </div>
                        <div className="overflow-y-auto flex-1 p-2 space-y-2">
                            {findings.map((f) => (
                                <div
                                    key={f.id}
                                    onClick={() => setActiveFinding(f)}
                                    className={`p-4 rounded-xl cursor-pointer border transition-all ${activeFinding?.id === f.id
                                        ? 'bg-blue-600/10 border-blue-500/50'
                                        : 'bg-slate-900/40 border-transparent hover:bg-slate-800'
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className={`text-[10px] font-bold px-2 py-0.5 rounded border ${severityColor(f.severity)}`}>
                                            {f.severity}
                                        </div>
                                        <div className="text-xs text-slate-500 font-mono">{f.timestamp}</div>
                                    </div>
                                    <h4 className={`font-bold text-sm mb-1 ${activeFinding?.id === f.id ? 'text-white' : 'text-slate-300'}`}>
                                        {f.type}
                                    </h4>
                                    <div className="flex items-center gap-2 text-xs">
                                        Status:
                                        {f.status === 'PENDING_REVIEW' && <span className="text-slate-400 flex items-center gap-1"><div className="w-2 h-2 bg-slate-500 rounded-full"></div> Pending</span>}
                                        {f.status === 'VALIDATED' && <span className="text-emerald-400 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Accepted</span>}
                                        {f.status === 'OVERRIDDEN' && <span className="text-amber-400 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Overridden</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* RIGHT: DETAIL */}
                    <div className="lg:col-span-2 flex flex-col gap-6">

                        {/* VIDEO PLAYER */}
                        <div className="bg-black aspect-video rounded-3xl border border-white/10 shadow-2xl flex items-center justify-center relative group overflow-hidden">
                            <div className="absolute inset-0 bg-blue-900/20 mix-blend-overlay"></div>
                            {/* Placeholder for uploaded image if it were a real video player handling specific frames */}
                            <Play className="w-16 h-16 text-white/50 group-hover:text-white group-hover:scale-110 transition-all cursor-pointer" />
                            <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur px-3 py-1 rounded-full text-xs font-mono">
                                Live Analysis Mode
                            </div>
                        </div>

                        {/* ACTION PANEL */}
                        {activeFinding && (
                            <div className="bg-slate-900 border border-white/5 rounded-3xl p-6 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>

                                <div className="flex justify-between items-start mb-6 relative z-10">
                                    <div>
                                        <h2 className="text-2xl font-bold mb-2 text-white">{activeFinding.type} Hazard</h2>
                                        <p className="text-slate-400 text-lg mb-4">{activeFinding.description}</p>

                                        {/* AI MITIGATION SECTION */}
                                        {activeFinding.mitigation && (
                                            <div className="bg-blue-900/20 border border-blue-500/20 p-4 rounded-xl mb-4">
                                                <h4 className="text-blue-400 font-bold mb-1 flex items-center gap-2">
                                                    <Shield className="w-4 h-4" /> AI Suggested Mitigation
                                                </h4>
                                                <p className="text-slate-300 text-sm">{activeFinding.mitigation}</p>
                                                {activeFinding.reasonably_practicable !== undefined && (
                                                    <div className={`text-xs mt-2 font-mono ${activeFinding.reasonably_practicable ? 'text-emerald-400' : 'text-red-400'}`}>
                                                        Reasonably Practicable: {activeFinding.reasonably_practicable ? "YES (Cost < Risk)" : "NO (Disproportionate)"}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {activeFinding.status === 'VALIDATED' && (
                                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3 text-emerald-400">
                                        <CheckCircle className="w-6 h-6" />
                                        <div>
                                            <div className="font-bold">Risk Validated</div>
                                            <div className="text-xs opacity-80">Included in final report.</div>
                                        </div>
                                    </div>
                                )}

                                {activeFinding.status === 'OVERRIDDEN' && (
                                    <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
                                        <div className="flex items-center gap-2 font-bold mb-1">
                                            <AlertTriangle className="w-5 h-5" /> Risk Overridden
                                        </div>
                                        <div className="text-sm italic opacity-80">"{activeFinding.justification}"</div>
                                    </div>
                                )}

                                {activeFinding.status === 'PENDING_REVIEW' && (
                                    <div className="flex gap-4 mt-8">
                                        <button
                                            onClick={() => handleAccept(activeFinding.id)}
                                            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-600/20"
                                        >
                                            <CheckCircle className="w-5 h-5" /> Accept Finding
                                        </button>
                                        <button
                                            onClick={handleOverrideClick}
                                            className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all border border-white/5 hover:border-white/20"
                                        >
                                            <XCircle className="w-5 h-5 text-red-400" /> Reject / Override
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* SUBMIT SECTION */}
                        <div className="mt-4 space-y-4">
                            <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6">
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Your Email Address
                                </label>
                                <input
                                    type="email"
                                    value={userEmail}
                                    onChange={(e) => setUserEmail(e.target.value)}
                                    placeholder="your.email@example.com"
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                                />
                                <p className="text-xs text-slate-400 mt-2">
                                    You'll receive a copy of the compliance report at this address.
                                </p>
                            </div>

                            <button
                                disabled={!allReviewed}
                                onClick={handleSubmitToSIA}
                                className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 text-lg"
                            >
                                {allReviewed ? (
                                    <> <FileText className="w-5 h-5" /> Download PDF Report </>
                                ) : (
                                    <> Review {findings.filter(f => f.status === 'PENDING_REVIEW').length} more items to submit </>
                                )}
                            </button>
                        </div>

                    </div>
                </div>

                {/* OVERRIDE MODAL */}
                {showOverrideModal && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-slate-900 border border-white/10 rounded-3xl p-8 w-full max-w-lg shadow-2xl relative">
                            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
                                <AlertTriangle className="text-amber-500" /> Justify Override
                            </h3>
                            <p className="text-slate-400 text-sm mb-6">
                                You are overriding an AI-detected Critical Hazard. Under Section 27 (Martyn's Law), you must provide a justification for why this risk is "As Low As Reasonably Practicable" (ALARP).
                            </p>
                            <textarea
                                value={overrideText}
                                onChange={(e) => setOverrideText(e.target.value)}
                                placeholder="E.g., 'Fire Marshall approved alternative route'..."
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-white focus:outline-none focus:border-blue-500 h-32 mb-6"
                                autoFocus
                            />
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setShowOverrideModal(false)}
                                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={submitOverride}
                                    className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-red-600/20"
                                >
                                    Confirm Override
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </main>
        </div>
    );
}
