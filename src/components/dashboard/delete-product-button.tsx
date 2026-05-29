"use client";

import { useRouter } from "next/navigation";
import { deleteProductAction } from "@/app/dashboard/actions";

type DeleteProductButtonProps = {
  productId: string;
  productName: string;
};

export function DeleteProductButton({
  productId,
  productName,
}: DeleteProductButtonProps) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={async () => {
        if (
          !confirm(
            `Удалить товар «${productName}»? Это действие нельзя отменить.`,
          )
        ) {
          return;
        }
        await deleteProductAction(productId);
        router.refresh();
      }}
      className="text-sm font-medium text-red-600 hover:text-red-700"
    >
      Удалить
    </button>
  );
}
