import React from 'react';
import type { AppProps } from 'next/app';
import { Analytics } from '@vercel/analytics/react';
import '../app/globals.css';

function MyApp({ Component, pageProps }: AppProps) {
    return (
        <>
            <Component {...pageProps} />
            <Analytics />
        </>
    );
}

export default MyApp;
