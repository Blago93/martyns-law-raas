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
    model_used?: string; // Added from AI
}

export default function ReviewAudit() {
    const router = useRouter();
    const [findings, setFindings] = useState<Finding[]>([]);
    const [activeFinding, setActiveFinding] = useState<Finding | null>(null);
    const [showOverrideModal, setShowOverrideModal] = useState(false);
    const [overrideText, setOverrideText] = useState('');
    const [digitalThreadId, setDigitalThreadId] = useState<string | null>(null);
    const [userEmail, setUserEmail] = useState('');
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [storedTranscript, setStoredTranscript] = useState<string | null>(null);
    const [evidenceCount, setEvidenceCount] = useState(0);

    // Get API URL from env or default to localhost for dev
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    // AI Analysis State
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // FETCH FINDINGS FROM DB
    const fetchFindings = async () => {
        try {
            const res = await fetch(`${API_URL}/api/audit/findings`);
            if (res.ok) {
                const data = await res.json();
                setFindings(data);
                if (data.length > 0 && !activeFinding) {
                    setActiveFinding(data[0]);
                }
            }
        } catch (error) {
            console.error("Failed to fetch findings:", error);
        }
    };

    useEffect(() => {
        // 1. Load persisted findings from DB
        fetchFindings();

        // 2. Check for Captured Frame from Record Page
        const storedImage = localStorage.getItem('AuditBestFrame');
        if (storedImage) {
            setCapturedImage(storedImage);
            // We don't clear findings here anymore, we want to see history + new analysis capability
        }

        const storedHash = localStorage.getItem('DigitalThreadStart');
        if (storedHash) {
            setDigitalThreadId(`${storedHash.substring(0, 8).toUpperCase()}-${storedHash.substring(storedHash.length - 4).toUpperCase()}`);
        }

        const trans = localStorage.getItem('raas_transcript');
        setStoredTranscript(trans);

        const count = Object.keys(localStorage).filter(k => k.startsWith('raas_evidence_')).length;
        setEvidenceCount(count);
    }, []);

    const handleAccept = async (id: string) => {
        // Optimistic UI Update
        setFindings(prev => prev.map(f =>
            f.id === id ? { ...f, status: 'VALIDATED' } : f
        ));

        // API Call
        try {
            await fetch(`${API_URL}/api/audit/findings/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'VALIDATED' })
            });
        } catch (e) {
            console.error("Failed to update status", e);
        }

        const idx = findings.findIndex(f => f.id === id);
        // If next exists use it, else null
        if (idx < findings.length - 1) setActiveFinding(findings[idx + 1]);
        else setActiveFinding(null);
    };

    const handleOverrideClick = () => {
        setShowOverrideModal(true);
        setOverrideText('');
    };

    const submitOverride = async () => {
        if (!activeFinding || !overrideText.trim()) return;

        const targetId = activeFinding.id;

        // Optimistic UI
        setFindings(prev => prev.map(f =>
            f.id === targetId ? {
                ...f,
                status: 'OVERRIDDEN',
                severity: 'LOW',
                justification: overrideText
            } : f
        ));

        setShowOverrideModal(false);

        // API Call
        try {
            await fetch(`${API_URL}/api/audit/findings/${targetId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: 'OVERRIDDEN',
                    justification: overrideText
                })
            });
        } catch (e) {
            console.error("Failed to update status", e);
        }

        const idx = findings.findIndex(f => f.id === targetId);
        if (idx < findings.length - 1) setActiveFinding(findings[idx + 1]);
        else setActiveFinding(null);
    };

    const handleSubmitToSIA = () => {
        if (!userEmail.trim()) {
            alert('Please enter your email address to receive the report.');
            return;
        }

        // Generate PDF using jsPDF
        const { jsPDF } = require('jspdf');
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.width;

        // --- HEADER ---
        doc.setFillColor(30, 41, 59); // Slate 800
        doc.rect(0, 0, pageWidth, 40, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.text('Martyn\'s Law Compliance Report', 20, 25);

        // --- METADATA ---
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        doc.text(`Digital Thread ID: ${digitalThreadId || 'N/A'}`, 20, 50);
        doc.text(`Date: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 20, 55);
        doc.text(`Report Recipient: ${userEmail}`, 20, 60);

        // --- EVIDENCE IMAGE ---
        let contentStartY = 70;
        if (capturedImage) {
            try {
                const imgProps = doc.getImageProperties(capturedImage);
                const imgWidth = 100;
                const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
                doc.addImage(capturedImage, 'JPEG', 20, 70, imgWidth, imgHeight);
                contentStartY = 70 + imgHeight + 10;
            } catch (e) {
                console.error("Could not add image to PDF", e);
            }
        }

        // --- FINDINGS TABLE ---
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text('Risk Assessment Findings', 20, contentStartY);

        let yPos = contentStartY + 10;

        findings.forEach((finding, index) => {
            if (yPos > 250) {
                doc.addPage();
                yPos = 20;
            }

            // Box for each finding
            doc.setDrawColor(200, 200, 200);
            doc.setFillColor(finding.status === 'VALIDATED' ? 240 : 255, finding.status === 'VALIDATED' ? 253 : 255, finding.status === 'VALIDATED' ? 244 : 255); // Light green if valid
            doc.rect(15, yPos, pageWidth - 30, 35, 'FD');

            doc.setFontSize(11);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(0, 0, 0);
            doc.text(`${index + 1}. ${finding.type} (${finding.severity})`, 20, yPos + 8);

            doc.setFontSize(9);
            doc.setFont("helvetica", "normal");
            const descLines = doc.splitTextToSize(finding.description, pageWidth - 50);
            doc.text(descLines, 20, yPos + 15);

            doc.setFontSize(8);
            doc.setTextColor(100, 100, 100);
            doc.text(`Status: ${finding.status}`, 20, yPos + 30);

            if (finding.mitigation) {
                doc.setTextColor(0, 100, 0);
                const mitLines = doc.splitTextToSize(`Mitigation: ${finding.mitigation}`, pageWidth - 50);
                doc.text(mitLines, 20, yPos + 25);
            }

            yPos += 40;
        });

        // Download PDF
        doc.save(`compliance-report-${digitalThreadId || 'draft'}.pdf`);

        alert(`PDF downloaded successfully! 📄\n\nSent to: ${userEmail}`);
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

        // Dynamic Venue Details from LocalStorage if available, else Mock
        const venueName = localStorage.getItem('raas_venue') || "Manchester Arena";
        formData.append('venue', JSON.stringify({ name: venueName, capacity: 21000 }));

        // HYBRID AUDIT: Inject Procedural Context
        const precheck = localStorage.getItem('raas_precheck');
        if (precheck) {
            formData.append('context', precheck);
        }

        // HYBRID AUDIT: Inject Audio Transcript
        const transcript = localStorage.getItem('raas_transcript');
        if (transcript) {
            formData.append('verbal_notes', transcript);
        }

        // HYBRID AUDIT: Inject Document Evidence
        // Loop through all keys in localStorage to find "raas_evidence_"
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('raas_evidence_')) {
                const evidenceBase64 = localStorage.getItem(key);
                if (evidenceBase64) {
                    formData.append('evidence_docs', evidenceBase64); // Send as array of strings
                }
            }
        }

        try {
            // Call Backend using API_URL const
            const res = await fetch(`${API_URL}/api/audit/analyze`, {
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
                mitigation: aiResult.mitigation || undefined,
                reasonably_practicable: aiResult.reasonably_practicable !== undefined ? !!aiResult.reasonably_practicable : undefined,
                model_used: aiResult.model_used || undefined
            };

            setFindings(prev => [newFinding, ...prev]);
            setActiveFinding(newFinding);
            alert("✅ AI Analysis Complete!\n\nNew finding added to the top of the list.");

        } catch (error: any) {
            console.error(error);
            const errorData = await error.response?.json();
            alert(`❌ AI Analysis Failed\n\n${errorData?.hint || error.message}`);
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
        <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 selection:text-primary font-sans">

            <Head>
                <title>Audit Review | RaaS</title>
            </Head>

            <MarketingHeader />

            <main className="pt-32 pb-20 px-4 max-w-7xl mx-auto">

                {/* HEADER */}
                <div className="flex flex-wrap items-center justify-between gap-6 mb-10 pb-8 border-b border-slate-200">
                    <div>
                        <h1 className="text-3xl font-extrabold flex items-center gap-3 text-primary tracking-tight">
                            <Shield className="text-primary fill-primary/10" /> Compliance Review
                        </h1>
                        <p className="text-slate-500 font-medium mt-1">Validate AI-detected risks before formalizing the compliance report.</p>
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
                            className="bg-primary hover:bg-primary/95 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-primary/20"
                        >
                            {isAnalyzing ? <Loader2 className="animate-spin w-4 h-4" /> : <Camera className="w-4 h-4" />}
                            {isAnalyzing ? "Analyzing Frame..." : "Analyze Live Evidence"}
                        </button>
                        <div className="bg-white border border-slate-200 px-4 py-2.5 rounded-xl shadow-sm flex items-center gap-3 font-mono text-xs hidden md:flex">
                            <Lock className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">Digital Thread</span>
                            <span className="text-primary font-bold">{digitalThreadId || 'PROVISIONING...'}</span>
                        </div>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">

                    {/* LEFT: LIST */}
                    <div className="lg:col-span-1 bg-white border border-slate-200 rounded-3xl overflow-hidden flex flex-col h-[600px] shadow-sm">
                        <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="font-bold text-xs text-slate-400 uppercase tracking-widest">Detected Risks ({findings.length})</h3>
                        </div>
                        <div className="overflow-y-auto flex-1 p-3 space-y-3">
                            {findings.map((f) => (
                                <div
                                    key={f.id}
                                    onClick={() => setActiveFinding(f)}
                                    style={{ display: f.status === 'VALIDATED' ? 'none' : 'block' }}
                                    className={`p-5 rounded-2xl cursor-pointer border-2 transition-all ${activeFinding?.id === f.id
                                        ? 'bg-primary/5 border-primary shadow-sm'
                                        : 'bg-white border-transparent hover:bg-slate-50'
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border uppercase tracking-widest ${severityColor(f.severity)}`}>
                                            {f.severity}
                                        </div>
                                        <div className="text-[10px] text-slate-400 font-mono">{f.timestamp}</div>
                                    </div>
                                    <h4 className={`font-bold text-base mb-2 leading-tight ${activeFinding?.id === f.id ? 'text-primary' : 'text-slate-700'}`}>
                                        {f.type}
                                    </h4>
                                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-tight text-slate-400">
                                        Status:
                                        {f.status === 'PENDING_REVIEW' && <span className="text-slate-500 flex items-center gap-1.5"><div className="w-1.5 h-1.5 bg-slate-400 rounded-full"></div> Pending Review</span>}
                                        {f.status === 'VALIDATED' && <span className="text-emerald-600 flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5" /> Accepted</span>}
                                        {f.status === 'OVERRIDDEN' && <span className="text-amber-600 flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" /> Overridden</span>}
                                    </div>
                                </div>
                            ))}
                            {findings.length === 0 && (
                                <div className="text-center py-10 opacity-50">
                                    <Shield className="w-12 h-12 mx-auto mb-2 text-slate-200" />
                                    <p className="text-sm font-medium">No risks detected</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT: DETAIL */}
                    <div className="lg:col-span-2 flex flex-col gap-6">

                        {/* VIDEO/EVIDENCE PREVIEW */}
                        <div className="bg-slate-900 aspect-video rounded-3xl border border-slate-200 shadow-2xl flex items-center justify-center relative group overflow-hidden">
                            {capturedImage ? (
                                <>
                                    <img src={capturedImage} alt="Evidence" className="w-full h-full object-cover opacity-90" />
                                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-primary/90 to-transparent p-6">
                                        <h4 className="text-white font-bold flex items-center gap-3">
                                            <Camera className="w-5 h-5 text-white/70" />
                                            <span className="uppercase tracking-widest text-[10px]">AI Analysis Source Frame</span>
                                        </h4>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="absolute inset-0 bg-primary/10 mix-blend-multiply"></div>
                                    <Play className="w-20 h-20 text-white/30" />
                                    <div className="absolute bottom-6 left-6 bg-primary/80 backdrop-blur px-4 py-1.5 rounded-full text-[10px] uppercase font-bold tracking-widest text-white border border-white/20">
                                        No Evidence Context
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Auto-Run Analysis Button if we have image but no findings */}
                        {capturedImage && findings.length === 0 && !isAnalyzing && (
                            <div className="p-8 bg-primary/5 border border-primary/20 rounded-3xl flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-bottom-4">
                                <div>
                                    <h3 className="font-bold text-primary text-lg">Cross-Analysis Ready</h3>
                                    <p className="text-sm text-slate-500 font-medium">Generate risk assessment from the latest capture frame.</p>
                                </div>
                                <button
                                    onClick={async () => {
                                        if (!capturedImage) return;
                                        try {
                                            const res = await fetch(capturedImage);
                                            const blob = await res.blob();
                                            const file = new File([blob], "evidence.jpg", { type: "image/jpeg" });

                                            const event = { target: { files: [file] } } as any;
                                            handleFileUpload(event);
                                        } catch (e) {
                                            console.error("Failed to process captured image", e);
                                        }
                                    }}
                                    className="bg-primary hover:bg-primary/95 text-white px-8 py-4 rounded-2xl font-bold transition-all shadow-xl shadow-primary/20 hover:scale-[1.02]"
                                >
                                    Initialize AI Analysis
                                </button>
                            </div>
                        )}

                        {/* TRANSCRIPT DISPLAY */}
                        {storedTranscript && (
                            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                                <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <div className="w-2 h-2 bg-red-500 rounded-full"></div> Verbal Compliance Notes
                                </h4>
                                <p className="text-slate-700 text-sm font-medium italic border-l-4 border-primary/20 pl-6 py-2 bg-slate-50 rounded-r-xl">
                                    "{storedTranscript}"
                                </p>
                            </div>
                        )}

                        {/* EVIDENCE DOCS DISPLAY */}
                        {evidenceCount > 0 && (
                            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                                <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-emerald-600" /> Procedural Evidence
                                </h4>
                                <p className="text-slate-600 text-sm font-medium">
                                    {evidenceCount} verification documents integrated for cross-analysis.
                                </p>
                            </div>
                        )}

                        {/* ACTION PANEL */}
                        {activeFinding && (
                            <div className="bg-white border border-slate-200 rounded-3xl p-10 relative overflow-hidden shadow-sm">
                                <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl -mr-40 -mt-40 pointer-events-none"></div>

                                <div className="flex justify-between items-start mb-8 relative z-10">
                                    <div>
                                        <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Hazard Assessment</div>
                                        <h2 className="text-3xl font-extrabold mb-3 text-primary tracking-tight">{activeFinding?.type} Risk</h2>
                                        <p className="text-slate-600 text-lg mb-8 font-medium leading-relaxed">{activeFinding?.description}</p>

                                        {/* AI MITIGATION SECTION */}
                                        {activeFinding?.mitigation && (
                                            <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl mb-6 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]">
                                                <h4 className="text-primary font-bold mb-3 flex items-center gap-2 text-sm">
                                                    <Shield className="w-4 h-4 text-primary fill-primary/10" /> AI Suggested Mitigation Strategy
                                                </h4>
                                                <p className="text-slate-600 text-sm font-medium leading-relaxed mb-4">{activeFinding.mitigation}</p>
                                                {activeFinding.reasonably_practicable !== undefined && (
                                                    <div className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full inline-block border ${activeFinding.reasonably_practicable ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                                                        ALARP Assessment: {activeFinding.reasonably_practicable ? "REASONABLY PRACTICABLE" : "DISPROPORTIONATE COST"}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* MODEL METADATA */}
                                        {activeFinding?.model_used && (
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="text-[10px] uppercase tracking-widest text-slate-400 font-extrabold">Analysis Engine:</div>
                                                <div className="bg-white border border-slate-200 px-3 py-1 rounded-full text-[10px] text-primary font-bold shadow-sm">
                                                    {activeFinding.model_used}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {activeFinding.status === 'VALIDATED' && (
                                    <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-4 text-emerald-800 shadow-sm animate-in zoom-in-95">
                                        <div className="bg-white p-2 rounded-full shadow-sm">
                                            <CheckCircle className="w-6 h-6 text-emerald-500" />
                                        </div>
                                        <div>
                                            <div className="font-extrabold text-sm uppercase tracking-wide">Finding Validated</div>
                                            <div className="text-xs font-medium opacity-80">Included in formal compliance digital thread.</div>
                                        </div>
                                    </div>
                                )}

                                {activeFinding?.status === 'OVERRIDDEN' && (
                                    <div className="p-5 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 shadow-sm animate-in zoom-in-95">
                                        <div className="flex items-center gap-3 font-extrabold text-sm uppercase tracking-wide mb-2">
                                            <AlertTriangle className="w-5 h-5 text-amber-500" /> Variance Record Created
                                        </div>
                                        <div className="text-sm font-medium italic opacity-80 border-l-2 border-amber-300 pl-4">"{activeFinding.justification}"</div>
                                    </div>
                                )}

                                {activeFinding.status === 'PENDING_REVIEW' && (
                                    <div className="flex gap-4 mt-8">
                                        <button
                                            onClick={() => handleAccept(activeFinding!.id)}
                                            className="flex-1 bg-primary hover:bg-primary/95 text-white font-bold py-5 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-primary/20 hover:scale-[1.02]"
                                        >
                                            <CheckCircle className="w-5 h-5" /> Accept Finding
                                        </button>
                                        <button
                                            onClick={handleOverrideClick}
                                            className="flex-1 bg-white hover:bg-slate-50 text-slate-600 font-bold py-5 rounded-2xl flex items-center justify-center gap-2 transition-all border border-slate-200 shadow-sm"
                                        >
                                            <XCircle className="w-5 h-5 text-red-500" /> Formal Reject
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* SUBMIT SECTION */}
                        <div className="mt-4 space-y-6">
                            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
                                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3">
                                    Report Distribution Email
                                </label>
                                <div className="relative">
                                    <input
                                        type="email"
                                        value={userEmail}
                                        onChange={(e) => setUserEmail(e.target.value)}
                                        placeholder="auditor@organization.gov.uk"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-primary font-bold placeholder-slate-300 focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all text-lg shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]"
                                    />
                                </div>
                                <p className="text-xs text-slate-400 mt-4 font-medium flex items-center gap-2">
                                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Authorized compliance report will be delivered securely.
                                </p>
                            </div>

                            <button
                                disabled={!allReviewed}
                                onClick={handleSubmitToSIA}
                                className="w-full bg-primary hover:bg-primary/95 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-extrabold py-6 rounded-3xl transition-all shadow-2xl shadow-primary/20 flex items-center justify-center gap-3 text-xl hover:scale-[1.01]"
                            >
                                {allReviewed ? (
                                    <> <FileText className="w-6 h-6" /> Formalize & Download Report </>
                                ) : (
                                    <> Review Remaining {findings.filter(f => f.status === 'PENDING_REVIEW').length} Items </>
                                )}
                            </button>
                        </div>

                    </div>
                </div>

                {/* OVERRIDE MODAL */}
                {showOverrideModal && (
                    <div className="fixed inset-0 bg-primary/20 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-in fade-in duration-300">
                        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-12 w-full max-w-xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] relative overflow-hidden animate-in zoom-in-95 duration-300">
                            <div className="absolute top-0 inset-x-0 h-2 bg-amber-500"></div>

                            <h3 className="text-2xl font-extrabold mb-4 flex items-center gap-3 text-primary tracking-tight">
                                <AlertTriangle className="text-amber-500 w-8 h-8" /> Auditor Variance Note
                            </h3>
                            <p className="text-slate-500 font-medium text-sm leading-relaxed mb-8">
                                You are overriding an AI-detected compliance hazard. Under <span className="text-primary font-bold">Section 27 of the Terrorism (Protection of Premises) Act</span>, you must provide a formal justification for why this risk is managed <span className="italic font-bold">As Low As Reasonably Practicable (ALARP)</span>.
                            </p>
                            <textarea
                                value={overrideText}
                                onChange={(e) => setOverrideText(e.target.value)}
                                placeholder="Formal justification for compliance deviation..."
                                className="w-full bg-slate-50 border border-slate-200 rounded-3xl p-6 text-primary font-medium focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 h-40 mb-8 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]"
                                autoFocus
                            />
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setShowOverrideModal(false)}
                                    className="flex-1 bg-white hover:bg-slate-50 text-slate-500 font-bold py-4 rounded-2xl transition-all border border-slate-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={submitOverride}
                                    className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-extrabold py-4 rounded-2xl transition-all shadow-xl shadow-amber-600/20 hover:scale-[1.02]"
                                >
                                    Submit Variance
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </main>
        </div>
    );
}
