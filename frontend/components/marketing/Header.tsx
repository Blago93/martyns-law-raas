'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Shield, LayoutDashboard, LogOut, ChevronDown, User } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function MarketingHeader() {
    const pathname = usePathname();
    const [user, setUser] = useState<string | null>(null);
    const [isScrolled, setIsScrolled] = useState(false);

    // Check Auth State
    useEffect(() => {
        const checkAuth = () => {
            const token = localStorage.getItem('raas_token');
            const username = localStorage.getItem('raas_user');
            if (token && username) {
                setUser(username);
            } else {
                setUser(null);
            }
        };

        checkAuth();

        // Listen for storage events (logout in another tab)
        window.addEventListener('storage', checkAuth);

        // Handle Scroll for transparency effect
        const handleScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);

        return () => {
            window.removeEventListener('storage', checkAuth);
            window.removeEventListener('scroll', handleScroll);
        };
    }, [pathname]); // Re-check on route change

    const handleLogout = () => {
        localStorage.removeItem('raas_token');
        localStorage.removeItem('raas_user');
        localStorage.removeItem('DigitalThreadStart');
        setUser(null);
        window.location.href = '/'; // Hard refresh to clear state
    };

    const isActive = (path: string) => pathname === path ? 'text-primary' : 'text-slate-500 hover:text-primary';

    // Header Background: solid/glass when scrolled, transparent when top
    const navClasses = `fixed top-0 w-full z-50 transition-all duration-300 border-b ${isScrolled
        ? 'bg-background/80 backdrop-blur-md border-border py-2 shadow-sm'
        : 'bg-transparent border-transparent py-4'
        }`;

    return (
        <nav className={navClasses}>
            <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">

                {/* LOGO */}
                <Link href="/" className="font-bold text-xl tracking-tight text-foreground flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <Shield className="fill-blue-600 text-blue-600" />
                    RaaS<span className="opacity-40 font-normal">.platform</span>
                </Link>

                {/* CENTER LINKS (Desktop) */}
                <div className="hidden md:flex items-center gap-8">
                    <Link href="/features" className={`text-sm font-semibold transition-colors ${isActive('/features')}`}>Features</Link>
                    <Link href="/pricing" className={`text-sm font-semibold transition-colors ${isActive('/pricing')}`}>Pricing</Link>
                    <Link href="/mission" className={`text-sm font-semibold transition-colors ${isActive('/mission')}`}>Mission</Link>
                    <Link href="/contact" className={`text-sm font-semibold transition-colors ${isActive('/contact')}`}>Contact</Link>
                </div>

                {/* RIGHT SIDE: AUTH */}
                <div className="flex gap-4">
                    {user ? (
                        <div className="flex items-center gap-4">
                            <Link href="/dashboard" className="hidden md:flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-primary transition-colors">
                                <LayoutDashboard className="w-4 h-4" /> Dashboard
                            </Link>

                            <div className="relative group">
                                <button className="flex items-center gap-2 bg-white hover:bg-slate-50 text-foreground pl-1 pr-4 py-1 rounded-full border border-border shadow-sm transition-all">
                                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground shadow-md shadow-primary/20">
                                        {user.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="text-sm font-semibold max-w-[100px] truncate capitalize">{user}</span>
                                    <ChevronDown className="w-3 h-3 text-slate-400" />
                                </button>

                                {/* Dropdown Menu */}
                                <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-border rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform origin-top-right scale-95 group-hover:scale-100 ring-1 ring-black/5">
                                    <div className="p-2 space-y-1">
                                        <div className="px-3 py-2 border-b border-slate-100 mb-1">
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Signed in as</p>
                                            <p className="text-sm font-bold text-foreground truncate">{user}</p>
                                        </div>

                                        <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-primary rounded-lg transition-colors">
                                            <LayoutDashboard className="w-4 h-4" /> Dashboard
                                        </Link>
                                        <Link href="/settings" className="flex items-center gap-3 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-primary rounded-lg transition-colors">
                                            <User className="w-4 h-4" /> Profile & Settings
                                        </Link>

                                        <div className="h-px bg-slate-100 my-1"></div>

                                        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg text-left transition-colors font-medium">
                                            <LogOut className="w-4 h-4" /> Sign Out
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            <Link href="/login" className="text-sm font-semibold hover:text-primary text-slate-500 transition-colors pt-2">Login</Link>
                            <Link href="/signup" className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-bold px-5 py-2 rounded-full transition-all shadow-lg shadow-primary/20">
                                Get Started
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}
