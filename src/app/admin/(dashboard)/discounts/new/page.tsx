import { createDiscountCode } from "../actions";
import { DiscountForm, type DiscountFormValues } from "../discount-form";

const emptyValues: DiscountFormValues = {
  code: "",
  type: "percentage",
  valuePercent: 10,
  valuePounds: 0,
  startsAt: "",
  endsAt: "",
  usageLimit: null,
  active: true,
};

export default function NewDiscountPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">New discount</h1>
      <DiscountForm action={createDiscountCode} initialValues={emptyValues} submitLabel="Create discount" />
    </div>
  );
}
