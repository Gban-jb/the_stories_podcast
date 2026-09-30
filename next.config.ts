import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    /**
     * Episode stills are served from YouTube's CDN. Only these two hosts, and
     * only over https, so a bad thumbnailUrl in the database can't turn the
     * image optimiser into an open proxy.
     */
    remotePatterns: [
      { protocol: "https", hostname: "i.ytimg.com", pathname: "/**" },
      { protocol: "https", hostname: "img.youtube.com", pathname: "/**" },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
