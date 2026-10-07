"use client";

import { useState, type Ref } from "react";
import { useT } from "@/lib/i18n/client";
import { COUNTRY_CODES, displayPhone, splitPhone } from "@/lib/utils/phone";
import { cn } from "@/lib/utils/cn";

type PhoneInputProps = {
  /** Имя поля формы: в него уходит номер целиком, «+7 701 123 45 67» */
  name: string;
  id: string;
  defaultValue?: string | null;
  required?: boolean;
  className?: string;
  /** Скрытое поле с полным номером — чтобы прочитать его снаружи (например, запомнить) */
  inputRef?: Ref<HTMLInputElement>;
  placeholder?: string;
};

/** Телефон: код страны из списка (+7 по умолчанию) и сам номер — без путаницы «+7 или 8» */
export function PhoneInput({ name, id, defaultValue, required, className, inputRef, placeholder = "701 123 45 67" }: PhoneInputProps) {
  const t = useT();
  const initial = splitPhone(defaultValue);
  const [code, setCode] = useState(initial.code);
  const [rest, setRest] = useState(initial.rest);

  // Вставили номер целиком («+7 701…», «8 701…») — сами разложим на код и номер
  const onRestChange = (value: string) => {
    const trimmed = value.trim();
    if (trimmed.startsWith("+") || (trimmed.replace(/\D/g, "").length === 11 && trimmed.startsWith("8"))) {
      const parsed = splitPhone(trimmed);
      setCode(parsed.code);
      setRest(parsed.rest);
      return;
    }
    setRest(value.replace(/[^\d\s()-]/g, ""));
  };

  const digits = rest.replace(/\D/g, "");
  const full = digits ? displayPhone(`+${code}${digits}`) : "";

  return (
    <div className="flex gap-2">
      <input type="hidden" name={name} value={full} ref={inputRef} />
      <label htmlFor={`${id}-code`} className="sr-only">
        {t.common.countryCode}
      </label>
      <select
        id={`${id}-code`}
        value={code}
        onChange={(e) => setCode(e.target.value)}
        // Ширину задаём стилем: в общих классах полей есть w-full, и код страны растягивался на всю строку
        className={cn(className, "shrink-0 pr-1")}
        style={{ width: "6.75rem", flex: "none" }}
      >
        {COUNTRY_CODES.map((c) => (
          <option key={c.code} value={c.code} title={c.country}>
            {c.flag} +{c.code}
          </option>
        ))}
      </select>
      <input
        id={id}
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        value={rest}
        onChange={(e) => onRestChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className={cn(className, "min-w-0")}
        style={{ flex: "1 1 0%", width: "auto" }}
      />
    </div>
  );
}
