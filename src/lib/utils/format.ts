// Intl для KZT пишет «KZT», а в Казахстане привычнее знак «₸»
const priceFormat = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 });

export function formatPrice(price: number): string {
  return `${priceFormat.format(price)}\u00a0₸`;
}

export function formatProductCount(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  const word =
    mod10 === 1 && mod100 !== 11
      ? "товар"
      : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)
        ? "товара"
        : "товаров";
  return `${count} ${word}`;
}
