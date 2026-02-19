import React from 'react';
import { useRouter } from 'next/router';
import Sidebar from './Sidebar';
import Breadcrumbs from './Breadcrumbs';

const PUBLIC_ROUTES = ['/', '/login', '/register', '/mission', '/pricing', '/contact'];

export default function Layout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const isPublic = PUBLIC_ROUTES.includes(router.pathname);

    if (isPublic) {
        return <>{children}</>;
    }

    return (
        <div className="flex min-h-screen bg-[hsl(var(--content-bg))]">
            {/* Persistent Sidebar */}
            <aside className="sticky top-0 h-screen z-40">
                <Sidebar />
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto w-full p-8">
                <div className="max-w-6xl mx-auto animate-fade-in-up">
                    <Breadcrumbs />
                    {children}
                </div>
            </main>
        </div>
    );
}
