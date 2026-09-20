import Link from "next/link";
import { createServerAuthClient } from "@/lib/supabase/auth-server";
import { deleteCategoryAction } from "./actions";

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  products: { id: string }[];
};

export default async function AdminCategoriesPage({ searchParams }: PageProps<"/admin/categories">) {
  const { error: errorParam } = await searchParams;
  const errorMessage = typeof errorParam === "string" ? errorParam : null;

  const supabase = await createServerAuthClient();
  const { data: categories, error } = await supabase.from("categories").select("id, name, slug, parent_id, products(id)").order("name").returns<CategoryRow[]>();

  const nameById = new Map((categories ?? []).map((category) => [category.id, category.name]));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Categories</h1>
        <Link href="/admin/categories/new" className="bg-black px-4 py-2 text-sm font-medium text-white">
          New category
        </Link>
      </div>

      {errorMessage && (
        <p className="text-sm text-red-600" role="alert">
          {errorMessage}
        </p>
      )}
      {error && <p className="text-sm text-red-600">Couldn&apos;t load categories: {error.message}</p>}

      {!error && (categories?.length ?? 0) === 0 && <p className="text-sm text-black/60">No categories yet — products are unassigned until you create one.</p>}

      {!error && (categories?.length ?? 0) > 0 && (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-black/10 text-black/50">
              <th className="py-2 pr-4 font-medium">Name</th>
              <th className="py-2 pr-4 font-medium">Parent</th>
              <th className="py-2 pr-4 font-medium">Products</th>
              <th className="py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {categories!.map((category) => (
              <tr key={category.id} className="border-b border-black/5">
                <td className="py-3 pr-4 font-medium">
                  <Link href={`/admin/categories/${category.id}`} className="hover:underline">
                    {category.name}
                  </Link>
                </td>
                <td className="py-3 pr-4 text-black/60">{category.parent_id ? (nameById.get(category.parent_id) ?? "—") : "—"}</td>
                <td className="py-3 pr-4 text-black/60">{category.products.length}</td>
                <td className="py-3 text-right">
                  <form action={deleteCategoryAction}>
                    <input type="hidden" name="id" value={category.id} />
                    <button type="submit" className="border border-black/20 px-2 py-1 text-xs hover:border-red-600 hover:text-red-600">
                      Delete
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
