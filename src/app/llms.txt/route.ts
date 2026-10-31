import { siteConfig } from "../site-config";
import { createPublicServerClient } from "@/lib/supabase/public";

export const revalidate = 3600;

export async function GET() {
  const lines = [
    `# ${siteConfig.name}`,
    "",
    `> ${siteConfig.description}`,
    "",
    `${siteConfig.name} is an independent workshop in ${siteConfig.location.city}, ${siteConfig.location.region}. We make custom parts and products for businesses and individuals. There is no minimum order, and we can design the piece from a photo, sketch, measurements or a description. Customers can collect in ${siteConfig.location.city} or have orders delivered anywhere in the UK.`,
    "",
    "## Services",
    "",
    "- 3D printing (PLA, PETG)",
    "- Rapid prototyping",
    "- Laser cutting (acrylic, plywood)",
    "- Laser engraving",
    "- Custom design: we design the piece for you and you approve it before we make anything",
    "",
    "## Key pages",
    "",
    `- [Home and quote request](${siteConfig.url}/): services, materials, how it works, FAQ and the quote form`,
    `- [Shop](${siteConfig.url}/shop): ready-to-order 3D printed and laser-cut pieces, made to order, some with personalisation`,
    `- [Track an order](${siteConfig.url}/track-order): check the status of an existing order`,
    `- [Delivery and returns](${siteConfig.url}/returns): UK delivery, collection, cancellations, refunds and faulty items`,
    `- [Terms and conditions](${siteConfig.url}/terms)`,
    `- [Privacy policy](${siteConfig.url}/privacy)`,
    "",
  ];

  try {
    const supabase = createPublicServerClient();
    const { data: products } = await supabase.from("products").select("slug, title").eq("status", "active").order("title");

    if (products?.length) {
      lines.push("## Products", "");
      for (const product of products) lines.push(`- [${product.title}](${siteConfig.url}/shop/${product.slug})`);
      lines.push("");
    }
  } catch {
    // Supabase env vars not configured (e.g. local build without .env) — omit the product list.
  }

  lines.push("## Contact", "", `- Email: ${siteConfig.email}`, `- Location: ${siteConfig.location.city}, ${siteConfig.location.region}, UK`, "");

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
