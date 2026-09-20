"use client";

import { useRef, useState, useTransition, type DragEvent } from "react";
import Image from "next/image";
import { deleteProductImageAction, reorderProductImagesAction, uploadProductImagesAction } from "../actions";

type ProductImage = { id: string; url: string; alt: string | null };

/**
 * Already-uploaded images for an existing product — drag thumbnails to
 * reorder (first = featured, matches the shop pages' sort_order convention),
 * or drag files from the desktop onto the drop zone to add more.
 */
export function ProductImagesManager({ productId, productTitle, initialImages }: { productId: string; productTitle: string; initialImages: ProductImage[] }) {
  const [images, setImages] = useState(initialImages);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const draggedIdRef = useRef<string | null>(null);

  function persistOrder(next: ProductImage[]) {
    const formData = new FormData();
    formData.set("productId", productId);
    formData.set("order", JSON.stringify(next.map((image) => image.id)));
    startTransition(() => {
      reorderProductImagesAction(formData);
    });
  }

  async function uploadFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList);
    if (files.length === 0) return;
    setUploadError(null);

    const formData = new FormData();
    formData.set("productId", productId);
    files.forEach((file) => formData.append("files", file));

    const result = await uploadProductImagesAction(formData);
    if (result.error) setUploadError(result.error);
    if (result.images?.length) setImages((prev) => [...prev, ...result.images!]);
  }

  function handleZoneDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragOver(false);
    if (event.dataTransfer.files.length > 0) uploadFiles(event.dataTransfer.files);
  }

  function handleThumbDrop(targetId: string) {
    const draggedId = draggedIdRef.current;
    draggedIdRef.current = null;
    if (!draggedId || draggedId === targetId) return;

    setImages((prev) => {
      const from = prev.findIndex((image) => image.id === draggedId);
      const to = prev.findIndex((image) => image.id === targetId);
      if (from === -1 || to === -1) return prev;
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      persistOrder(next);
      return next;
    });
  }

  async function removeImage(image: ProductImage) {
    setImages((prev) => prev.filter((current) => current.id !== image.id));
    const formData = new FormData();
    formData.set("imageId", image.id);
    formData.set("productId", productId);
    formData.set("url", image.url);
    await deleteProductImageAction(formData);
  }

  function move(id: string, direction: -1 | 1) {
    setImages((prev) => {
      const index = prev.findIndex((image) => image.id === id);
      const target = index + direction;
      if (index === -1 || target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      persistOrder(next);
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <span className="text-sm">Media</span>
      <p className="text-xs text-black/50">The first image is the featured image shown in the shop grid and at the top of the product page. Drag thumbnails to reorder.</p>

      {images.length > 0 && (
        <div className="flex flex-wrap gap-4">
          {images.map((image, index) => (
            <figure
              key={image.id}
              draggable
              onDragStart={() => {
                draggedIdRef.current = image.id;
              }}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                handleThumbDrop(image.id);
              }}
              className="flex w-[140px] cursor-grab flex-col gap-2 active:cursor-grabbing"
            >
              <div className="relative">
                <Image src={image.url} alt={image.alt || productTitle} width={140} height={140} className="h-[140px] w-[140px] border border-black/10 object-cover" />
                {index === 0 && <span className="absolute top-1 left-1 bg-black px-1.5 py-0.5 text-[10px] font-medium text-white">Featured</span>}
              </div>
              <div className="flex justify-between gap-1">
                <button type="button" onClick={() => move(image.id, -1)} disabled={index === 0} className="border border-black/20 px-1.5 py-0.5 text-xs disabled:opacity-30" aria-label="Move earlier">
                  ←
                </button>
                <button type="button" onClick={() => removeImage(image)} className="border border-black/20 px-1.5 py-0.5 text-xs hover:border-red-600 hover:text-red-600">
                  Remove
                </button>
                <button
                  type="button"
                  onClick={() => move(image.id, 1)}
                  disabled={index === images.length - 1}
                  className="border border-black/20 px-1.5 py-0.5 text-xs disabled:opacity-30"
                  aria-label="Move later"
                >
                  →
                </button>
              </div>
            </figure>
          ))}
        </div>
      )}

      <div
        onDragEnter={(event) => {
          event.preventDefault();
          setIsDragOver(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node)) setIsDragOver(false);
        }}
        onDrop={handleZoneDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`flex min-h-[110px] cursor-pointer flex-col items-center justify-center gap-1 border border-dashed px-6 py-6 text-center transition-colors ${
          isDragOver ? "border-black bg-black/[.04]" : "border-black/25 hover:border-black/40"
        }`}
      >
        <span className="text-sm font-medium">Upload new</span>
        <span className="text-xs text-black/50">Drag and drop, or click to browse — JPG, PNG or WebP, up to 5 MB each</span>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(event) => {
            if (event.target.files) uploadFiles(event.target.files);
            event.target.value = "";
          }}
        />
      </div>

      {uploadError && (
        <p className="text-sm text-red-600" role="alert">
          {uploadError}
        </p>
      )}
      {isPending && <p className="text-xs text-black/40">Saving order…</p>}
    </div>
  );
}
