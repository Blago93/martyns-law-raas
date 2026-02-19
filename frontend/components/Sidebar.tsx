import React, { useState } from 'react';
import { useRouter } from 'next/router';
import {
    LayoutDashboard,
    FileText,
    Archive,
    Settings,
    LogOut,
    ChevronLeft,
    ChevronRight,
    ShieldAlert
} from 'lucide-react';
import { isAuthenticated, logout, getUser } from '../utils/auth';

export default function Sidebar() {
    const router = useRouter();
    const [collapsed, setCollapsed] = useState(false);
    const user = getUser();

    const menuItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
        { icon: ShieldAlert, label: 'Start Audit', path: '/audit/questionnaire' }, // Direct link to start
        { icon: Archive, label: 'Archive', path: '/archive' },
        { icon: Settings, label: 'Settings', path: '/settings' },
    ];

    const handleLogout = () => {
        logout();
    };

    return (
        <div className={`h-screen bg-[var(--background)] border-r border-white/10 transition-all duration-300 flex flex-col ${collapsed ? 'w-20' : 'w-64'}`}>

            {/* Header */}
            <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
                {!collapsed && (
                    <span className="font-bold text-white tracking-tight">RaaS <span className="text-[var(--primary)]">App</span></span>
                )}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="p-1 rounded hover:bg-white/10 text-gray-400 transition-colors"
                >
                    {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-6 space-y-2 px-2">
                {menuItems.map((item) => {
                    const isActive = router.pathname.startsWith(item.path);
                    return (
                        <button
                            key={item.path}
                            onClick={() => router.push(item.path)}
                            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all ${isActive
                                    ? 'bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20'
                                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                }`}
                        >
                            <item.icon size={20} />
                            {!collapsed && <span className="font-medium text-sm">{item.label}</span>}
                            {isActive && !collapsed && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--primary)] text-[var(--primary)] shadow-[0_0_8px_currentColor]" />}
                        </button>
                    );
                })}
            </nav>

            {/* User Footer */}
            <div className="p-4 border-t border-white/10">
                <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex items-center justify-center text-[var(--background)] font-bold text-xs">
                        {user?.email?.[0].toUpperCase() || 'U'}
                    </div>
                    {!collapsed && (
                        <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-medium text-white truncate">{user?.email || 'User'}</p>
                            <p className="text-xs text-gray-500 truncate">Standard Plan</p>
                        </div>
                    )}
                    {!collapsed && (
                        <button onClick={handleLogout} className="text-gray-500 hover:text-white transition-colors">
                            <LogOut size={18} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
