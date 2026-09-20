import Link from "next/link";

export default function AdminDashboardPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="max-w-xl text-sm text-black/60">
        Orders, customers, discounts and analytics land here in later stages of Phase 1 (see Section 7 of the technical plan). For now:
      </p>
      <Link href="/admin/products" className="inline-block bg-black px-4 py-2 text-sm font-medium text-white">
        Manage products →
      </Link>
    </div>
  );
}
