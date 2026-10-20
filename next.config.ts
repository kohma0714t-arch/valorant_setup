import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // メディア本体はブラウザ→Storageへ直接アップロードするため、Server Actionのボディは小さく保つ
      bodySizeLimit: "1mb",
    },
  },
};

export default nextConfig;
