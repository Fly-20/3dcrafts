import { notFound } from "next/navigation";
import { createServerAuthClient } from "@/lib/supabase/auth-server";
import { updateCategory } from "../actions";
import { CategoryForm, type CategoryFormValues } from "../category-form";

export default async function EditCategoryPage({ params }: PageProps<"/admin/categories/[id]">) {
  const { id } = await params;
  const supabase = await createServerAuthClient();

  const [{ data: category }, { data: categories }] = await Promise.all([
    supabase.from("categories").select("*").eq("id", id).maybeSingle(),
    supabase.from("categories").select("id, name").neq("id", id).order("name"),
  ]);

  if (!category) notFound();

  const initialValues: CategoryFormValues = { id: category.id, name: category.name, slug: category.slug, parentId: category.parent_id };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">{category.name}</h1>
      <CategoryForm action={updateCategory} initialValues={initialValues} submitLabel="Save changes" availableParents={categories ?? []} />
    </div>
  );
}
