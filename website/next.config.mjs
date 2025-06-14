/** @type {import('next').NextConfig} */

const nextConfig = {
    async redirects() {
        return [
            {
                source: '/servers',
                destination: '/services',
                permanent: true,
            },
            {
                source: '/servers.html',
                destination: '/services',
                permanent: true,
            },
            {
                source: '/services.html',
                destination: '/services',
                permanent: true,
            },
            {
                source: '/zt.html',
                destination: '/zero-tier',
                permanent: true,
            },
            {
                source: '/index.html',
                destination: '/',
                permanent: true,
            }
        ];
    },
};

export default nextConfig;
