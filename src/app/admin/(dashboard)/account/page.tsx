import { requireAdmin } from "@/lib/admin-auth";

export default async function AdminAccountPage() {
  const session = await requireAdmin();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Account</h1>

      <dl className="flex max-w-md flex-col gap-4 text-sm">
        <div className="flex flex-col gap-1 border-b border-black/10 pb-4">
          <dt className="text-black/50">Name</dt>
          <dd>{session.name || "—"}</dd>
        </div>
        <div className="flex flex-col gap-1 border-b border-black/10 pb-4">
          <dt className="text-black/50">Email</dt>
          <dd>{session.email}</dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="text-black/50">Role</dt>
          <dd className="capitalize">{session.role}</dd>
        </div>
      </dl>
    </div>
  );
}
