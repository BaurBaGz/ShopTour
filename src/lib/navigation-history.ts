"use client";

// Была ли переход внутри сайта без перезагрузки. Если да — «Назад» может вернуть
// на предыдущую страницу сайта (с её фильтрами и прокруткой), иначе ведём по ссылке.
let hasInAppHistory = false;

export function markInAppNavigation() {
  hasInAppHistory = true;
}

export function canGoBackInApp() {
  return hasInAppHistory;
}
