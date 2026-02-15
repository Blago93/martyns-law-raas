/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    output: 'export', // For Capacitor (static site generation)
    images: {
        unoptimized: true // Mandatory for static export
    }
};

module.exports = nextConfig;
