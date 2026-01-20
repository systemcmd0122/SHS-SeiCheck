/** @type {import('next').NextConfig} */
import withPWA from 'next-pwa';

const withPwaConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  reloadOnOnline: true,
  disable: false,
});

const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  turbopack: {},
};

export default withPwaConfig(nextConfig);
