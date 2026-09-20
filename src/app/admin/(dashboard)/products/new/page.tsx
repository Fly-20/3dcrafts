import { createServerAuthClient } from "@/lib/supabase/auth-server";
import { createProduct } from "../actions";
import { ProductForm, type ProductFormValues } from "../product-form";
import { ProductImagesField } from "../product-images-field";

const emptyValues: ProductFormValues = {
  title: "",
  description: "",
  fulfilmentType: "stock",
  status: "draft",
  basePricePounds: 0,
  vatRatePercent: 20,
  sku: "",
  weightGrams: 100,
  stockQuantity: 0,
  productionTimeMinutes: null,
  categoryId: null,
  urlHandle: "",
  seoTitle: "",
  seoDescription: "",
};

export default async function NewProductPage() {
  const supabase = await createServerAuthClient();
  const { data: categories } = await supabase.from("categories").select("id, name").order("name");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">New product</h1>
      <ProductForm action={createProduct} initialValues={emptyValues} submitLabel="Create product" imagesField={<ProductImagesField />} categories={categories ?? []} />
    </div>
  );
}
