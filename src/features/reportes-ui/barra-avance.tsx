import { cn } from "@/lib/cn";
import { formatoAvance } from "@/lib/formato";

function Barra({ etiqueta, valor, color }: { etiqueta: string; valor: number; color: string }) {
  const ancho = Math.min(100, Math.max(0, valor));
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-16 shrink-0 text-slate-500">{etiqueta}</span>
      <div
        role="progressbar"
        aria-label={`Avance ${etiqueta.toLowerCase()}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={valor}
        aria-valuetext={formatoAvance(valor)}
        className="h-1.5 min-w-16 flex-1 overflow-hidden rounded-full bg-slate-100"
      >
        <div className={cn("h-full rounded-full", color)} style={{ width: `${ancho}%` }} />
      </div>
      <span className="w-14 shrink-0 text-right text-slate-700 tabular-nums">{formatoAvance(valor)}</span>
    </div>
  );
}

/** Avance real frente al planeado (ambos en 0–100). */
export function BarrasAvance({ real, planeado, className }: { real: number; planeado: number; className?: string }) {
  return (
    <div className={cn("space-y-1", className)}>
      <Barra etiqueta="Real" valor={real} color="bg-marca-700" />
      <Barra etiqueta="Planeado" valor={planeado} color="bg-acento-500" />
    </div>
  );
}
