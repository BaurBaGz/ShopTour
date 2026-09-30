import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import { getStoreColor, getStoreInitial } from "@/lib/utils/store-color";

type StoreAvatarProps = {
  store: { id: string; name: string; logo_url: string | null };
  /** Атрибут sizes для next/image — ширина, в которой показывается логотип */
  sizes: string;
  /** Размер буквы, когда логотипа нет */
  textClassName?: string;
};

/** Логотип магазина или первая буква на светлом цветном фоне. Заполняет родителя (relative + размеры). */
export function StoreAvatar({ store, sizes, textClassName = "text-xl" }: StoreAvatarProps) {
  if (store.logo_url) {
    return (
      <Image
        src={store.logo_url}
        alt={store.name}
        fill
        className="object-cover"
        sizes={sizes}
      />
    );
  }

  return (
    <div
      className={cn("flex h-full w-full items-center justify-center font-semibold", textClassName)}
      // Мягкий оттенок вместо яркой заливки: буква не спорит с фото товаров
      style={{ backgroundColor: `${getStoreColor(store.id)}1f`, color: getStoreColor(store.id) }}
      role="img"
      aria-label={store.name}
    >
      {getStoreInitial(store.name)}
    </div>
  );
}
