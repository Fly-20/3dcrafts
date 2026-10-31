import { createTimelapse } from "../actions";
import { TimelapseForm, type TimelapseFormValues } from "../timelapse-form";

const emptyValues: TimelapseFormValues = { customerName: "", customerEmail: "", etsyOrderId: "", slug: "" };

export default function NewTimelapsePage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">New timelapse</h1>
      <TimelapseForm action={createTimelapse} initialValues={emptyValues} submitLabel="Create timelapse" requireVideo />
    </div>
  );
}
