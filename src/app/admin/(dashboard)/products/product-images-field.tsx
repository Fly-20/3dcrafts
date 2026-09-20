"use client";

import { useRef, useState, type DragEvent } from "react";

type PendingImage = { id: string; file: File; previewUrl: string };

/**
 * Lets an admin attach images while creating a product, before it has an id
 * (product_images rows can't exist yet). Files are held client-side and
 * submitted under name="images" in the same form as the rest of the product
 * fields — createProduct() uploads them, in order, once the product row
 * exists. The first image is the featured/main image, same convention as
 * the shop pages (product_images ordered by sort_order).
 */
export function ProductImagesField() {
  const [images, setImages] = useState<PendingImage[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pickerRef = useRef<HTMLInputElement>(null);
  const draggedIdRef = useRef<string | null>(null);

  function syncFileInput(next: PendingImage[]) {
    const dataTransfer = new DataTransfer();
    next.forEach((image) => dataTransfer.items.add(image.file));
    if (fileInputRef.current) fileInputRef.current.files = dataTransfer.files;
  }

  function addFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList);
    if (files.length === 0) return;
    const added = files.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setImages((prev) => {
      const next = [...prev, ...added];
      syncFileInput(next);
      return next;
    });
    if (pickerRef.current) pickerRef.current.value = "";
  }

  function removeImage(id: string) {
    setImages((prev) => {
      const removed = prev.find((image) => image.id === id);
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      const next = prev.filter((image) => image.id !== id);
      syncFileInput(next);
      return next;
    });
  }

  function move(id: string, direction: -1 | 1) {
    setImages((prev) => {
      const index = prev.findIndex((image) => image.id === id);
      const target = index + direction;
      if (index === -1 || target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      syncFileInput(next);
      return next;
    });
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
      syncFileInput(next);
      return next;
    });
  }

  function handleZoneDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragOver(false);
    if (event.dataTransfer.files.length > 0) addFiles(event.dataTransfer.files);
  }

  return (
    <div className="flex flex-col gap-3">
      <span className="text-sm">Media</span>
      <input ref={fileInputRef} type="file" name="images" multiple className="hidden" />

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
              className="flex w-[120px] cursor-grab flex-col gap-2 active:cursor-grabbing"
            >
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview, next/image doesn't handle object URLs */}
                <img src={image.previewUrl} alt="" className="h-[120px] w-[120px] border border-black/10 object-cover" />
                {index === 0 && <span className="absolute top-1 left-1 bg-black px-1.5 py-0.5 text-[10px] font-medium text-white">Featured</span>}
              </div>
              <div className="flex justify-between gap-1">
                <button type="button" onClick={() => move(image.id, -1)} disabled={index === 0} className="border border-black/20 px-1.5 py-0.5 text-xs disabled:opacity-30" aria-label="Move earlier">
                  ←
                </button>
                <button type="button" onClick={() => removeImage(image.id)} className="border border-black/20 px-1.5 py-0.5 text-xs hover:border-red-600 hover:text-red-600">
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
        onClick={() => pickerRef.current?.click()}
        className={`flex min-h-[110px] cursor-pointer flex-col items-center justify-center gap-1 border border-dashed px-6 py-6 text-center transition-colors ${
          isDragOver ? "border-black bg-black/[.04]" : "border-black/25 hover:border-black/40"
        }`}
      >
        <span className="text-sm font-medium">Upload new</span>
        <span className="text-xs text-black/50">Drag and drop, or click to browse — JPG, PNG or WebP, up to 5 MB each. First image is the featured image.</span>
        <input ref={pickerRef} type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => event.target.files && addFiles(event.target.files)} className="hidden" />
      </div>
    </div>
  );
}
