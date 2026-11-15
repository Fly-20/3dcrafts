import { createServerAuthClient } from "@/lib/supabase/auth-server";
import { getPricingSettings } from "@/lib/pricing/store";
import { laserRatePerHour, plywoodPerCm2, printerRatePerHour } from "@/lib/pricing/engine";
import { PricingForm } from "./pricing-form";

export default async function PricingSettingsPage() {
  const supabase = await createServerAuthClient();
  const { settings, stored } = await getPricingSettings(supabase);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Pricing settings</h1>
      <p className="max-w-3xl text-sm text-black/60">
        The figures the quote calculator uses (HQ brief §9.1). Prices include VAT; filament and plywood are entered inc VAT and the VAT is taken off because it&apos;s reclaimed. Works out
        to: printer £{printerRatePerHour(settings).toFixed(2)}/h, laser £{laserRatePerHour(settings).toFixed(2)}/h, usable plywood £{(plywoodPerCm2(settings) * 10000).toFixed(2)}/m².
      </p>
      {!stored && (
        <p className="border-l-4 border-amber-500 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Migration 0007 isn&apos;t applied yet: showing the built-in defaults, which can&apos;t be edited until it is.
        </p>
      )}
      <PricingForm settings={settings} editable={stored} />
    </div>
  );
}
