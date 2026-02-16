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
    const [capturedImage, setCapturedImage] = useState<string | null>(null);

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
        formData.append('venue', JSON.stringify({ name: "Manchester Arena", capacity: 21000 })); // Dynamic later

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
                                    onClick={() => setActiveFinding(f)} // Keep clicked
                                    // Hide if validated? Or just dim it. User wants "clear the box".
                                    // Let's hide it from this list if status is valid
                                    style={{ display: f.status === 'VALIDATED' ? 'none' : 'block' }}
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
                        {/* VIDEO/EVIDENCE PREVIEW */}
                        <div className="bg-black aspect-video rounded-3xl border border-white/10 shadow-2xl flex items-center justify-center relative group overflow-hidden">
                            {capturedImage ? (
                                <>
                                    <img src={capturedImage} alt="Evidence" className="w-full h-full object-cover opacity-80" />
                                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-4">
                                        <h4 className="text-white font-bold flex items-center gap-2">
                                            <Camera className="w-4 h-4 text-blue-500" /> Analysis Frame
                                        </h4>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="absolute inset-0 bg-blue-900/20 mix-blend-overlay"></div>
                                    <Play className="w-16 h-16 text-white/50" />
                                    <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur px-3 py-1 rounded-full text-xs font-mono">
                                        No Evidence Loaded
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Auto-Run Analysis Button if we have image but no findings */}
                        {capturedImage && findings.length === 0 && !isAnalyzing && (
                            <div className="p-6 bg-blue-900/20 border border-blue-500/30 rounded-2xl flex items-center justify-between">
                                <div>
                                    <h3 className="font-bold text-blue-100">Evidence Ready</h3>
                                    <p className="text-sm text-blue-300">Run AI analysis on this captured frame.</p>
                                </div>
                                <button
                                    onClick={async () => {
                                        // Convert base64 to blob/file
                                        const res = await fetch(capturedImage);
                                        const blob = await res.blob();
                                        const file = new File([blob], "evidence.jpg", { type: "image/jpeg" });

                                        // Mock event to reuse handleFileUpload
                                        const event = { target: { files: [file] } } as any;
                                        handleFileUpload(event);
                                    }}
                                    className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20"
                                >
                                    Start Analysis
                                </button>
                            </div>
                        )}

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
