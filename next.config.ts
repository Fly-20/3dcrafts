import type { NextConfig } from "next";

// Product images live in Supabase Storage (see 3d-crafts-phase1-technical-plan.md, Section 4a),
// so next/image needs the project's storage domain allow-listed.
const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname : undefined;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: supabaseHostname ? [{ protocol: "https", hostname: supabaseHostname, pathname: "/storage/v1/object/public/**" }] : [],
  },
  // No serverActions.bodySizeLimit override: timelapse videos and product
  // images upload straight from the browser to Supabase Storage via signed
  // URLs, so Server Actions only carry form fields (default 1MB is plenty).
};

export default nextConfig;
