import type { ComponentProps } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";

/** Enlace con apariencia de botón secundario (para acciones de navegación en el encabezado). */
export function EnlaceBoton({ className, ...props }: ComponentProps<typeof Link>) {
  return (
    <Link
      className={cn(
        "inline-flex h-9 items-center justify-center gap-2 rounded-md bg-white px-3.5 text-sm font-medium whitespace-nowrap text-slate-700",
        "ring-1 ring-slate-300 ring-inset hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-700",
        className,
      )}
      {...props}
    />
  );
}
