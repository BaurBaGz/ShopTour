"use client";

import { useT } from "@/lib/i18n/client";
import { useRouter } from "next/navigation";
import { deleteProductAction } from "@/app/(cabinet)/dashboard/actions";

type DeleteProductButtonProps = {
  productId: string;
  productName: string;
};

export function DeleteProductButton({
  productId,
  productName,
}: DeleteProductButtonProps) {
  const router = useRouter();
  const c = useT().cabinet.products;

  return (
    <button
      type="button"
      onClick={async () => {
        if (
          !confirm(c.deleteConfirm(productName))
        ) {
          return;
        }
        await deleteProductAction(productId);
        router.push("/dashboard/products");
        router.refresh();
      }}
      className="inline-flex min-h-11 items-center text-sm font-medium text-red-600 hover:text-red-700"
    >
      {c.delete}
    </button>
  );
}
