import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 정적 HTML 내보내기 (GitHub Pages용)
  output: 'export',

  // 이미지 최적화 비활성화 (정적 빌드용)
  images: {
    unoptimized: true,
  },

  // Turbopack 설정 (Next.js 16+)
  turbopack: {},
};

export default nextConfig;
