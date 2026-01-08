import { useEffect, useRef } from "react";
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.css";
import Label from "./Label";
import { CalenderIcon } from "../../icons";
import Hook = flatpickr.Options.Hook;
import DateOption = flatpickr.Options.DateOption;

type PropsType = {
  id: string;
  mode?: "single" | "multiple" | "range" | "time";
  onChange?: Hook | Hook[];
  defaultDate?: DateOption;
  value?: DateOption; // ✅ controlled value
  label?: string;
  placeholder?: string;
};

export default function DatePicker({ id, mode, onChange, label, defaultDate, value, placeholder }: PropsType) {
  const fpRef = useRef<flatpickr.Instance | null>(null);

  // ✅ Create / destroy the flatpickr instance
  useEffect(() => {
    const el = document.getElementById(id) as HTMLInputElement | null;
    if (!el) return;

    fpRef.current = flatpickr(el, {
      mode: mode || "single",
      static: true,
      monthSelectorType: "static",
      dateFormat: "Y-m-d",
      defaultDate: value ?? defaultDate, // ✅ initial value wins if provided
      onChange,
    });

    return () => {
      fpRef.current?.destroy();
      fpRef.current = null;
    };
    // ⚠️ only depends on id (and static init options if you truly need)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // ✅ Update instance when props change (controlled)
  useEffect(() => {
    const inst = fpRef.current;
    if (!inst) return;

    // Update mode if it changes
    if (mode && inst.config.mode !== mode) {
      inst.set("mode", mode);
    }

    // Update onChange handler if it changes
    if (onChange) {
      inst.set("onChange", onChange);
    }

    // Controlled value update
    if (value !== undefined) {
      inst.setDate(value, false); // false = don't trigger onChange
    }
  }, [mode, onChange, value]);

  return (
    <div>
      {label && <Label htmlFor={id}>{label}</Label>}

      <div className="relative">
        <input
          id={id}
          placeholder={placeholder}
          className="h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3  dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30  bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700  dark:focus:border-brand-800"
        />

        <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
          <CalenderIcon className="size-6" />
        </span>
      </div>
    </div>
  );
}
