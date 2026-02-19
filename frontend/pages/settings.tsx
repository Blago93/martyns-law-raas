import { useState, useEffect } from 'react';
import Head from 'next/head';
import MarketingHeader from '../components/marketing/Header'; // Legacy, will replace with Sidebar
import { User, Building, Save, Bell, Shield, Plus, Trash2, Loader2, MapPin, Briefcase, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/router';
import { isAuthenticated, getToken } from '../utils/auth';

interface ResponsiblePerson {
    name: string;
    role: string;
    email: string;
    phone: string;
}

export default function Settings() {
    const [user, setUser] = useState('');
    const [venueName, setVenueName] = useState('');
    const [capacity, setCapacity] = useState('');
    const [address, setAddress] = useState('');
    const [responsiblePersons, setResponsiblePersons] = useState<ResponsiblePerson[]>([]);

    // UI State
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    useEffect(() => {
        const username = localStorage.getItem('raas_user');
        setUser(username || 'Admin');
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch(`${API_URL}/api/settings`);
            if (res.ok) {
                const data = await res.json();
                setVenueName(data.venue.venue_name || '');
                setCapacity(data.venue.max_capacity?.toString() || '');
                setAddress(data.venue.address || '');
                setResponsiblePersons(data.responsiblePersons || []);
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddPerson = () => {
        setResponsiblePersons([...responsiblePersons, { name: '', role: 'Fire Marshal', email: '', phone: '' }]);
    };

    const handleRemovePerson = (index: number) => {
        const newList = [...responsiblePersons];
        newList.splice(index, 1);
        setResponsiblePersons(newList);
    };

    const handlePersonChange = (index: number, field: keyof ResponsiblePerson, value: string) => {
        const newList = [...responsiblePersons];
        newList[index][field] = value;
        setResponsiblePersons(newList);
    };

    const handleSave = async () => {
        setMessage('');
        try {
            const payload = {
                venue: { venue_name: venueName, max_capacity: parseInt(capacity) || 0, address },
                responsiblePersons
            };

            const res = await fetch(`${API_URL}/api/settings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setMessage('✅ Settings Saved Successfully');
                // Persist venue name for other pages
                localStorage.setItem('raas_venue', venueName);
                setTimeout(() => setMessage(''), 3000);
            } else {
                setMessage('❌ Failed to save settings');
            }
        } catch (error) {
            console.error('Error saving:', error);
            setMessage('❌ Error saving settings');
        }
    };

    const tier = (parseInt(capacity) || 0) >= 800 ? 'ENHANCED' : 'STANDARD';

    if (loading) return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center text-slate-400 font-sans gap-4">
            <Loader2 className="w-12 h-12 text-primary/10 animate-spin" />
            <div className="text-[10px] font-extrabold uppercase tracking-widest">Accessing Secure Configuration...</div>
        </div>
    );

    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 selection:text-primary font-sans">
            <Head>
                <title>Settings | RaaS Platform</title>
            </Head>

            {/* Header handled by Layout */}

            <main className="pt-32 pb-20 px-4 max-w-5xl mx-auto">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12 pb-8 border-b border-slate-200">
                    <div>
                        <h1 className="text-3xl font-extrabold flex items-center gap-3 text-primary tracking-tight">
                            <User className="text-primary fill-primary/10" /> Global Configuration
                        </h1>
                        <p className="text-slate-500 font-medium mt-1">Manage your venue profile, responsible persons, and audit preferences.</p>
                    </div>
                    {message && (
                        <div className={`px-6 py-3 rounded-2xl text-sm font-extrabold flex items-center gap-2 transition-all shadow-sm ${message.includes('✅') ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : 'bg-red-50 text-red-700 ring-1 ring-red-200'}`}>
                            {message}
                        </div>
                    )}
                </div>

                <div className="grid lg:grid-cols-3 gap-6">

                    {/* COL 1: VENUE DETAILS */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* VENUE CARD */}
                        <div className="bg-white border border-slate-200 rounded-[2rem] p-10 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>

                            <h2 className="text-xl font-extrabold mb-8 flex items-center gap-3 text-primary tracking-tight">
                                <Building className="w-5 h-5 text-primary" /> Facility Profile
                            </h2>
                            <div className="grid md:grid-cols-2 gap-8 mb-8">
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Authenticated Venue Name</label>
                                    <input
                                        type="text"
                                        value={venueName}
                                        onChange={(e) => setVenueName(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-primary font-bold placeholder-slate-300 focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]"
                                        placeholder="e.g. Manchester Arena"
                                    />
                                </div>
                                <div className="space-y-4">
                                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Operational Capacity (PAX)</label>
                                    <input
                                        type="number"
                                        value={capacity}
                                        onChange={(e) => setCapacity(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-primary font-bold placeholder-slate-300 focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]"
                                        placeholder="e.g. 1000"
                                    />
                                </div>
                                <div className="space-y-4">
                                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Compliance Designation</label>
                                    <div className={`w-full px-6 py-4 rounded-2xl text-center font-extrabold border shadow-sm ${tier === 'ENHANCED' ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-primary/5 border-primary/20 text-primary'}`}>
                                        {tier} TIER
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Registered Site Address</label>
                                <textarea
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-primary font-medium placeholder-slate-300 focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 h-32 resize-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]"
                                    placeholder="Full venue address..."
                                />
                            </div>
                        </div>

                        {/* RESPONSIBLE PERSONS CARD */}
                        <div className="bg-white border border-slate-200 rounded-[2rem] p-10 shadow-sm relative overflow-hidden">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-xl font-extrabold flex items-center gap-3 text-primary tracking-tight">
                                    <Shield className="w-5 h-5 text-emerald-600" /> Designated Persons
                                </h2>
                                <button onClick={handleAddPerson} className="text-[10px] uppercase tracking-widest font-extrabold bg-slate-100 hover:bg-slate-200 text-slate-600 px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-sm">
                                    <Plus className="w-3.5 h-3.5" /> Register Profile
                                </button>
                            </div>

                            {responsiblePersons.length === 0 ? (
                                <div className="text-center py-10 bg-slate-50 border border-dashed border-slate-200 rounded-3xl group hover:border-primary/20 transition-all">
                                    <User className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                                    <p className="text-slate-400 font-medium text-sm">
                                        No designated persons registered. <br /> Martyn's Law requires clear accountability.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {responsiblePersons.map((person, index) => (
                                        <div key={index} className="bg-slate-50 p-6 rounded-[1.5rem] border border-slate-200 flex flex-col md:flex-row gap-6 items-start md:items-center group hover:bg-white hover:border-primary/20 transition-all shadow-sm">
                                            <div className="flex-1 grid grid-cols-2 gap-6 w-full">
                                                <div className="space-y-1">
                                                    <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Full Name</label>
                                                    <input
                                                        placeholder="Name"
                                                        value={person.name}
                                                        onChange={(e) => handlePersonChange(index, 'name', e.target.value)}
                                                        className="w-full bg-transparent border-b border-transparent group-hover:border-slate-200 focus:border-primary text-sm py-1 outline-none font-bold text-primary transition-all"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Responsibility</label>
                                                    <select
                                                        value={person.role}
                                                        onChange={(e) => handlePersonChange(index, 'role', e.target.value)}
                                                        className="w-full bg-transparent border-b border-transparent group-hover:border-slate-200 focus:border-primary text-sm py-1 outline-none text-slate-500 font-medium transition-all"
                                                    >
                                                        <option>Fire Marshal</option>
                                                        <option>Security Lead</option>
                                                        <option>General Manager</option>
                                                        <option>First Aider</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Email Contact</label>
                                                    <input
                                                        placeholder="Email"
                                                        value={person.email}
                                                        onChange={(e) => handlePersonChange(index, 'email', e.target.value)}
                                                        className="w-full bg-transparent border-b border-transparent group-hover:border-slate-200 focus:border-primary text-sm py-1 outline-none text-slate-500 font-medium transition-all"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Secure Phone</label>
                                                    <input
                                                        placeholder="Phone"
                                                        value={person.phone}
                                                        onChange={(e) => handlePersonChange(index, 'phone', e.target.value)}
                                                        className="w-full bg-transparent border-b border-transparent group-hover:border-slate-200 focus:border-primary text-sm py-1 outline-none text-slate-500 font-medium transition-all"
                                                    />
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleRemovePerson(index)}
                                                className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* COL 2: SIDEBAR */}
                    <div className="space-y-8">
                        {/* PROFILE CARD */}
                        <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm">
                            <h2 className="text-[10px] font-extrabold mb-6 text-slate-400 uppercase tracking-widest">Identity Summary</h2>
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-[9px] font-extrabold text-slate-400 mb-1 uppercase tracking-widest">Authenticated User</label>
                                    <div className="text-primary font-bold text-lg tracking-tight">{user}</div>
                                </div>
                                <div>
                                    <label className="block text-[9px] font-extrabold text-slate-400 mb-1 uppercase tracking-widest">Permission Scope</label>
                                    <div className="text-slate-600 font-semibold flex items-center gap-2">
                                        <Briefcase className="w-4 h-4 text-primary" /> Facility Administrator
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[9px] font-extrabold text-slate-400 mb-1 uppercase tracking-widest">Licensing Status</label>
                                    <div className="text-emerald-600 font-extrabold flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4" /> Professional Tier
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* NOTIFICATIONS */}
                        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
                            <h2 className="text-[10px] font-extrabold mb-6 text-slate-400 uppercase tracking-widest">Communication</h2>
                            <div className="space-y-3">
                                <label className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl cursor-pointer group hover:bg-primary/5 transition-all outline-none">
                                    <input type="checkbox" defaultChecked className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary/20 cursor-pointer" />
                                    <span className="text-sm font-bold text-slate-600">Secure PDF Delivery</span>
                                </label>
                                <label className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl cursor-pointer group hover:bg-primary/5 transition-all outline-none">
                                    <input type="checkbox" defaultChecked className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary/20 cursor-pointer" />
                                    <span className="text-sm font-bold text-slate-600">Critical Compliance Alerts</span>
                                </label>
                            </div>
                        </div>

                        <button
                            onClick={handleSave}
                            className="w-full bg-primary hover:bg-primary/95 text-white font-extrabold py-5 px-8 rounded-2xl flex items-center justify-center gap-3 shadow-2xl shadow-primary/20 transition-all hover:scale-[1.02] text-lg"
                        >
                            <Save className="w-5 h-5" /> Commit All Changes
                        </button>
                    </div>

                </div>
            </main>
        </div>
    );
}
