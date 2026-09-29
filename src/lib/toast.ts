"use client";

// Короткие уведомления внизу экрана. Показ — showToast(), отрисовка — <Toaster/> в layout.
export type Toast = {
  id: number;
  message: string;
  action?: { label: string; href?: string; onClick?: () => void };
};

type Listener = (toast: Toast) => void;

const listeners = new Set<Listener>();
let nextId = 1;

export function showToast(toast: Omit<Toast, "id">) {
  const full = { ...toast, id: nextId++ };
  listeners.forEach((listener) => listener(full));
}

export function subscribeToasts(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
