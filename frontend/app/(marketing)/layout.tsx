import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import React from 'react';
import MarketingHeader from '../../components/marketing/Header';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Martyn's Law Compliance | Resilience as a Service",
    description: "AI-powered Martyn's Law compliance for Standard Tier venues. Video walkthrough risk assessments and Reasonably Practicable verification.",
};

export default function MarketingLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={inter.className}>
                <MarketingHeader />
                {children}
            </body>
        </html>
    );
}
