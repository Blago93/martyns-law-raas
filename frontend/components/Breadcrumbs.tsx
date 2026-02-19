import React from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

export default function Breadcrumbs() {
    const router = useRouter();

    // Clean path segments
    const pathSegments = router.asPath
        .split('?')[0]
        .split('/')
        .filter((segment) => segment !== '');

    // Map segment to readable label
    const getLabel = (segment: string) => {
        return segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
    };

    return (
        <nav className="flex items-center text-sm text-gray-400 mb-6 animate-fade-in">
            <Link href="/dashboard" className="hover:text-white transition-colors flex items-center">
                <Home size={14} className="mr-1" />
                Home
            </Link>

            {pathSegments.map((segment, index) => {
                const href = '/' + pathSegments.slice(0, index + 1).join('/');
                const isLast = index === pathSegments.length - 1;

                return (
                    <React.Fragment key={href}>
                        <ChevronRight size={14} className="mx-2 text-gray-600" />
                        {isLast ? (
                            <span className="font-medium text-[var(--primary)] pointer-events-none">
                                {getLabel(segment)}
                            </span>
                        ) : (
                            <Link href={href} className="hover:text-white transition-colors">
                                {getLabel(segment)}
                            </Link>
                        )}
                    </React.Fragment>
                );
            })}
        </nav>
    );
}
