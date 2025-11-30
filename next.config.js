/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/yogasession',
  assetPrefix: '/yogasession/',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
