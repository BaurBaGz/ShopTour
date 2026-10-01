"use client";

import { useEffect, useRef, useState } from "react";
import { uploadStoreImage } from "@/lib/media";
import { cn } from "@/lib/utils/cn";

type ImagesInputProps = {
  /** Имя скрытого поля формы: ссылки через перевод строки */
  name: string;
  defaultValue?: string[];
  /** Магазин, в папку которого грузим; без него загрузка недоступна */
  storeId: string | null;
  kind?: "products" | "stores" | "banners";
  /** 1 — одно фото (логотип) */
  max?: number;
  label?: string;
  /** Сообщить наружу о новом списке фото (например, для превью) */
  onChange?: (urls: string[]) => void;
};

/** Фото товара или логотип: загрузка файлами, порядок, обложка, удаление, ссылка вручную */
export function ImagesInput({ name, defaultValue = [], storeId, kind = "products", max = 8, label = "Фото", onChange }: ImagesInputProps) {
  const [images, setImages] = useState<string[]>(defaultValue.filter(Boolean));

  // Сообщаем наружу после отрисовки (не во время неё) и не при первом показе
  const onChangeRef = useRef(onChange);
  const firstRender = useRef(true);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    onChangeRef.current?.(images);
  }, [images]);
  const [uploading, setUploading] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [urlDraft, setUrlDraft] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const single = max === 1;
  const full = images.length >= max;

  const addFiles = async (files: FileList | null) => {
    if (!files?.length || !storeId) return;
    setError(null);
    const list = Array.from(files).slice(0, max - images.length);
    setUploading(list.length);
    for (const file of list) {
      try {
        const url = await uploadStoreImage(storeId, kind, file);
        setImages((current) => (single ? [url] : [...current, url]));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Не удалось загрузить фото");
      } finally {
        setUploading((n) => n - 1);
      }
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const move = (index: number, delta: number) =>
    setImages((current) => {
      const next = [...current];
      const target = index + delta;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });

  const addUrl = () => {
    const url = urlDraft.trim();
    if (!/^https:\/\/\S+$/.test(url)) {
      setError("Ссылка должна начинаться с https://");
      return;
    }
    setImages((current) => (single ? [url] : [...current, url]));
    setUrlDraft("");
    setError(null);
  };

  return (
    <fieldset>
      <legend className="mb-1.5 block text-sm font-medium text-stone-700">{label}</legend>
      <input type="hidden" name={name} value={images.join("\n")} />

      <div className={cn("grid gap-3", single ? "grid-cols-[96px_1fr] items-center" : "grid-cols-3 sm:grid-cols-4")}>
        {images.map((src, index) => (
          <div key={src} className="group relative aspect-[4/5] overflow-hidden rounded-xl bg-stone-100 ring-1 ring-stone-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={single ? "Логотип" : `Фото ${index + 1}`} className="h-full w-full object-cover" />
            {!single && index === 0 && (
              <span className="absolute left-1.5 top-1.5 rounded-full bg-stone-900/80 px-2 py-0.5 text-[11px] font-semibold text-white">
                Обложка
              </span>
            )}
            <div className="absolute inset-x-1 bottom-1 flex justify-between gap-1">
              {!single && (
                <span className="flex gap-1">
                  <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label="Сдвинуть влево" className="h-8 w-8 rounded-lg bg-white/90 text-sm text-stone-700 shadow disabled:opacity-30">←</button>
                  <button type="button" onClick={() => move(index, 1)} disabled={index === images.length - 1} aria-label="Сдвинуть вправо" className="h-8 w-8 rounded-lg bg-white/90 text-sm text-stone-700 shadow disabled:opacity-30">→</button>
                </span>
              )}
              <button
                type="button"
                onClick={() => setImages((current) => current.filter((_, i) => i !== index))}
                aria-label="Убрать фото"
                className="ml-auto h-8 w-8 rounded-lg bg-white/90 text-sm text-red-700 shadow"
              >
                ✕
              </button>
            </div>
          </div>
        ))}

        {!full && (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={!storeId || uploading > 0}
            className={cn(
              "flex flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-stone-300 text-sm text-stone-600 transition hover:border-rose-300 hover:bg-rose-50/40 disabled:cursor-not-allowed disabled:opacity-50",
              single ? "h-24 w-24" : "aspect-[4/5]",
            )}
          >
            <span className="text-2xl leading-none" aria-hidden>+</span>
            {uploading > 0 ? `Загружаем… ${uploading}` : single ? "Загрузить" : "Добавить фото"}
          </button>
        )}
        {single && images.length === 0 && (
          <p className="text-sm text-stone-500">Квадратное изображение, лучше от 400×400 px</p>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple={!single}
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => addFiles(e.target.files)}
      />
      {!storeId && <p className="mt-2 text-xs text-amber-700">Сначала выберите магазин — фото сохраняются в его папку.</p>}

      {!full && (
        <div className="mt-3 flex gap-2">
          <label htmlFor={`${name}-url`} className="sr-only">Ссылка на фото</label>
          <input
            id={`${name}-url`}
            value={urlDraft}
            onChange={(e) => setUrlDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addUrl();
              }
            }}
            placeholder="или вставьте ссылку на фото"
            className="min-h-11 flex-1 rounded-xl border border-stone-200 bg-white px-3 text-sm outline-none focus:border-rose-300 focus:ring-4 focus:ring-rose-500/15"
          />
          <button type="button" onClick={addUrl} className="min-h-11 rounded-xl px-4 text-sm font-medium text-stone-700 ring-1 ring-stone-200 hover:bg-stone-50">
            Добавить
          </button>
        </div>
      )}
      {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
      {!single && <p className="mt-2 text-xs text-stone-500">Первое фото — обложка в каталоге. Фото сжимаются автоматически.</p>}
    </fieldset>
  );
}
