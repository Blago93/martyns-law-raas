import React from 'react';
import type { AppProps } from 'next/app';
import { Analytics } from '@vercel/analytics/react';
import '../app/globals.css';

import Layout from '../components/Layout';

function MyApp({ Component, pageProps }: AppProps) {
    return (
        <Layout>
            <Component {...pageProps} />
            <Analytics />
        </Layout>
    );
}

export default MyApp;
