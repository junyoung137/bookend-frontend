/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // TypeScript 경로 별칭(@/...) 지원
  webpack(config) {
    config.resolve.alias['@'] = new URL('./', import.meta.url).pathname;
    return config;
  },

  // 프로덕션 배포 최적화 (추가)
  swcMinify: true,
  compress: true,
  
  // 보안 헤더 (추가)
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
        ],
      },
    ];
  },
};

export default nextConfig;