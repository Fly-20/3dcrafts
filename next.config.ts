import type { NextConfig } from "next";

// Product images live in Supabase Storage (see 3d-crafts-phase1-technical-plan.md, Section 4a),
// so next/image needs the project's storage domain allow-listed.
const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname : undefined;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: supabaseHostname ? [{ protocol: "https", hostname: supabaseHostname, pathname: "/storage/v1/object/public/**" }] : [],
  },
  // Default is 1MB; raised so the timelapse upload form (video files, capped
  // at 20MB in lib/supabase/timelapse-storage.ts) can submit directly as a
  // Server Action without a separate signed-upload-URL step.
  experimental: {
    serverActions: {
      bodySizeLimit: "20mb",
    },
  },
};

export default nextConfig;
