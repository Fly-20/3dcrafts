import { statusDotClass } from "@/lib/order-status";

export function StatusBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm">
      <span className={`h-1.5 w-1.5 rounded-full ${statusDotClass(label)}`} />
      {label}
    </span>
  );
}
