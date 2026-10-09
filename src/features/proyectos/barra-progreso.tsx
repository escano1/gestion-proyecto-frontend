import { cn } from "@/lib/cn";
import { formatoAvance } from "@/lib/formato";

const TONOS = {
  marca: "bg-marca-600",
  naranja: "bg-[#eb6834]",
  verde: "bg-emerald-600",
  rojo: "bg-red-600",
} as const;

interface Props {
  /** Valor 0–100 (se recorta visualmente a ese rango). */
  valor: number;
  etiqueta: string;
  tono?: keyof typeof TONOS;
  /** Muestra la etiqueta y el porcentaje encima de la barra. */
  conTexto?: boolean;
  className?: string;
}

/**
 * Barra de progreso accesible (role="progressbar"). Usa solo `span` para poder ubicarse dentro
 * de párrafos (p. ej. el detalle de un StatCard).
 */
export function BarraProgreso({ valor, etiqueta, tono = "marca", conTexto = false, className }: Props) {
  const ancho = Math.min(100, Math.max(0, valor));
  return (
    <span className={cn("block", className)}>
      {conTexto && (
        <span className="mb-1 flex items-baseline justify-between gap-2 text-sm">
          <span className="text-slate-600">{etiqueta}</span>
          <span className="font-semibold text-slate-900 tabular-nums">{formatoAvance(valor)}</span>
        </span>
      )}
      <span
        role="progressbar"
        aria-label={etiqueta}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(ancho)}
        aria-valuetext={formatoAvance(valor)}
        className={cn("block w-full overflow-hidden rounded-full bg-slate-100", conTexto ? "h-2.5" : "h-2")}
      >
        <span className={cn("block h-full rounded-full", TONOS[tono])} style={{ width: `${ancho}%` }} />
      </span>
    </span>
  );
}
