"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { createServerAuthClient } from "@/lib/supabase/auth-server";

export type CategoryFormState = { error?: string; success?: boolean };

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function readCategoryFields(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  if (!name) return { error: "Name is required." };

  const slugInput = String(formData.get("slug") || "").trim();
  const slug = slugify(slugInput || name);
  if (!slug) return { error: "Couldn't derive a slug — check the name or slug field." };

  const parentId = String(formData.get("parentId") || "").trim();
  return { name, slug, parentId: parentId || null };
}

export async function createCategory(_prevState: CategoryFormState, formData: FormData): Promise<CategoryFormState> {
  await requireAdmin();
  const fields = readCategoryFields(formData);
  if ("error" in fields) return fields;

  const supabase = await createServerAuthClient();
  const { error } = await supabase.from("categories").insert({ name: fields.name, slug: fields.slug, parent_id: fields.parentId });
  if (error) return { error: error.code === "23505" ? "A category with that slug already exists." : error.message };

  revalidatePath("/admin/categories");
  redirect("/admin/categories");
}

export async function updateCategory(_prevState: CategoryFormState, formData: FormData): Promise<CategoryFormState> {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  if (!id) return { error: "Missing category reference." };
  if (String(formData.get("parentId") || "") === id) return { error: "A category can't be its own parent." };

  const fields = readCategoryFields(formData);
  if ("error" in fields) return fields;

  const supabase = await createServerAuthClient();
  const { error } = await supabase.from("categories").update({ name: fields.name, slug: fields.slug, parent_id: fields.parentId }).eq("id", id);
  if (error) return { error: error.code === "23505" ? "A category with that slug already exists." : error.message };

  revalidatePath("/admin/categories");
  revalidatePath(`/admin/categories/${id}`);
  return { success: true };
}

export async function deleteCategoryAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  if (!id) return;

  const supabase = await createServerAuthClient();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  revalidatePath("/admin/categories");

  if (error) {
    const message = error.code === "23503" ? "Can't delete — products or subcategories are still assigned to this category." : error.message;
    redirect(`/admin/categories?error=${encodeURIComponent(message)}`);
  }
}
