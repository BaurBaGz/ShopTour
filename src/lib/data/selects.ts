// Общие select-строки: используются и на сервере, и в браузере (избранное)
export const PRODUCT_SELECT = `
  *,
  stores!products_store_id_fkey ( id, name, city ),
  categories!products_category_id_fkey ( id, name )
`;
