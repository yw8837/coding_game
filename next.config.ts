import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return ['/admin/:path*', '/api/admin/:path*'].map(source=>({source,headers:[{key:'Cache-Control',value:'private, no-store'},{key:'X-Robots-Tag',value:'noindex, nofollow'},{key:'X-Frame-Options',value:'DENY'}]}));
  }
};

export default nextConfig;
