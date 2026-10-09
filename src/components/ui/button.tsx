import type { ComponentProps } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

const VARIANTES = {
  primario: "bg-marca-700 text-white hover:bg-marca-800 focus-visible:outline-marca-700",
  secundario: "bg-white text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-slate-50",
  peligro: "bg-red-600 text-white hover:bg-red-700 focus-visible:outline-red-600",
  fantasma: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
} as const;

const TAMANOS = {
  sm: "h-8 px-2.5 text-xs gap-1.5",
  md: "h-9 px-3.5 text-sm gap-2",
} as const;

type Props = ComponentProps<"button"> & {
  variante?: keyof typeof VARIANTES;
  tamano?: keyof typeof TAMANOS;
  cargando?: boolean;
};

export function Button({
  variante = "primario",
  tamano = "md",
  cargando = false,
  disabled,
  className,
  children,
  type = "button",
  ...props
}: Props) {
  return (
    <button
      type={type}
      disabled={disabled || cargando}
      className={cn(
        "inline-flex items-center justify-center rounded-md font-medium whitespace-nowrap transition-colors",
        "focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        VARIANTES[variante],
        TAMANOS[tamano],
        className,
      )}
      {...props}
    >
      {cargando && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}
