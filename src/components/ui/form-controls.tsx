import { useId, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/cn";

const BASE =
  "block w-full rounded-md border-0 bg-white px-3 py-1.5 text-sm text-slate-900 shadow-xs ring-1 ring-inset " +
  "placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-marca-600 disabled:bg-slate-100 disabled:text-slate-500";

const conError = (invalido?: boolean) => (invalido ? "ring-red-400 focus:ring-red-500" : "ring-slate-300");

export function Input({ className, "aria-invalid": invalido, ...props }: ComponentProps<"input">) {
  return (
    <input
      aria-invalid={invalido}
      className={cn(BASE, "h-9", conError(Boolean(invalido)), className)}
      {...props}
    />
  );
}

export function Select({ className, "aria-invalid": invalido, children, ...props }: ComponentProps<"select">) {
  return (
    <select
      aria-invalid={invalido}
      className={cn(BASE, "h-9 pr-8", conError(Boolean(invalido)), className)}
      {...props}
    >
      {children}
    </select>
  );
}

export function Textarea({ className, "aria-invalid": invalido, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      aria-invalid={invalido}
      rows={3}
      className={cn(BASE, conError(Boolean(invalido)), className)}
      {...props}
    />
  );
}

export function Checkbox({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      type="checkbox"
      className={cn("size-4 rounded border-slate-300 text-marca-700 focus:ring-marca-600", className)}
      {...props}
    />
  );
}

interface FieldProps {
  label: string;
  error?: string;
  ayuda?: string;
  className?: string;
  /** Recibe el id para asociar la etiqueta al control. */
  children: (id: string) => ReactNode;
}

/** Etiqueta + control + mensaje de error/ayuda. */
export function Field({ label, error, ayuda, className, children }: FieldProps) {
  const id = useId();
  return (
    <div className={cn("space-y-1", className)}>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      {children(id)}
      {error ? (
        <p className="text-xs text-red-600" role="alert">
          {error}
        </p>
      ) : (
        ayuda && <p className="text-xs text-slate-500">{ayuda}</p>
      )}
    </div>
  );
}
