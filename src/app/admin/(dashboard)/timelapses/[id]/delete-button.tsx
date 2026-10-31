"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteTimelapseFromDetailAction } from "../actions";

export function DeleteTimelapseButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleClick() {
    if (!window.confirm("Delete this timelapse? The video and its link will stop working immediately.")) return;
    startTransition(async () => {
      await deleteTimelapseFromDetailAction(id);
      router.push("/admin/timelapses");
    });
  }

  return (
    <button type="button" onClick={handleClick} disabled={isPending} className="self-start border border-red-600 px-4 py-2 text-sm font-medium text-red-600 disabled:opacity-60">
      {isPending ? "Deleting…" : "Delete timelapse"}
    </button>
  );
}
