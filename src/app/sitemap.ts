import type { MetadataRoute } from "next";
import { siteConfig } from "./site-config";
import { createPublicServerClient } from "@/lib/supabase/public";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    {
      url: siteConfig.url,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${siteConfig.url}/shop`,
      changeFrequency: "daily",
      priority: 0.8,
    },
  ];

  try {
    const supabase = createPublicServerClient();
    const { data: products } = await supabase.from("products").select("slug, updated_at").eq("status", "active");

    for (const product of products ?? []) {
      entries.push({
        url: `${siteConfig.url}/shop/${product.slug}`,
        lastModified: product.updated_at,
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }
  } catch {
    // Supabase env vars not configured (e.g. local build without .env) — fall back to the static entries above.
  }

  return entries;
}
