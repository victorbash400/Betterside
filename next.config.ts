import type { NextConfig } from "next";
const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  devIndicators: false,
  serverExternalPackages: ["ffmpeg-static"],
  outputFileTracingIncludes: {
    "/api/audio/transcribe": ["./node_modules/ffmpeg-static/ffmpeg"],
  },
};
export default config;
