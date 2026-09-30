"use client";

import { startTransition } from "react";

/**
 * Отправка формы в серверное действие без очистки полей.
 * React 19 сам сбрасывает форму с action={…} после отправки — даже если сервер вернул ошибку,
 * и человеку приходится вводить всё заново. Здесь форма остаётся как есть.
 * Нажатая кнопка (name/value) попадает в данные — как при обычной отправке.
 */
export function submitKeepingValues(
  dispatch: (formData: FormData) => void,
  before?: (event: React.FormEvent<HTMLFormElement>) => void,
) {
  return (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    before?.(event);
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLElement | null;
    const formData = new FormData(event.currentTarget, submitter);
    startTransition(() => dispatch(formData));
  };
}
