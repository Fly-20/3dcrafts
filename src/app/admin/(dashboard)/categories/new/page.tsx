import { createServerAuthClient } from "@/lib/supabase/auth-server";
import { createCategory } from "../actions";
import { CategoryForm, type CategoryFormValues } from "../category-form";

const emptyValues: CategoryFormValues = { name: "", slug: "", parentId: null };

export default async function NewCategoryPage() {
  const supabase = await createServerAuthClient();
  const { data: categories } = await supabase.from("categories").select("id, name").order("name");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">New category</h1>
      <CategoryForm action={createCategory} initialValues={emptyValues} submitLabel="Create category" availableParents={categories ?? []} />
    </div>
  );
}
