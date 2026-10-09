import type { ComponentProps, ReactNode } from "react";
import { AlertTriangle, Inbox, Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "./button";

export function Card({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("rounded-lg bg-white shadow-xs ring-1 ring-slate-200", className)} {...props} />;
}

export function CardHeader({ titulo, acciones, descripcion }: { titulo: string; acciones?: ReactNode; descripcion?: string }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 px-4 py-3">
      <div>
        <h2 className="text-sm font-semibold text-slate-900">{titulo}</h2>
        {descripcion && <p className="mt-0.5 text-xs text-slate-500">{descripcion}</p>}
      </div>
      {acciones && <div className="flex flex-wrap gap-2">{acciones}</div>}
    </div>
  );
}

const TONOS = {
  gris: "bg-slate-100 text-slate-700 ring-slate-300/60",
  azul: "bg-marca-50 text-marca-700 ring-marca-500/30",
  verde: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  amarillo: "bg-amber-50 text-amber-800 ring-amber-600/30",
  rojo: "bg-red-50 text-red-700 ring-red-600/20",
} as const;

export type Tono = keyof typeof TONOS;

export function Badge({ tono = "gris", children, className }: { tono?: Tono; children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset",
        TONOS[tono],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function PageHeader({ titulo, descripcion, acciones }: { titulo: string; descripcion?: string; acciones?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">{titulo}</h1>
        {descripcion && <p className="mt-1 text-sm text-slate-500">{descripcion}</p>}
      </div>
      {acciones && <div className="flex flex-wrap gap-2">{acciones}</div>}
    </div>
  );
}

export function StatCard({ titulo, valor, detalle, icono, tono }: {
  titulo: string;
  valor: ReactNode;
  detalle?: ReactNode;
  icono?: ReactNode;
  tono?: "normal" | "alerta";
}) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-slate-500">{titulo}</p>
        {icono && <span className={cn("text-slate-400", tono === "alerta" && "text-amber-500")}>{icono}</span>}
      </div>
      <p className={cn("mt-2 text-2xl font-semibold text-slate-900", tono === "alerta" && "text-amber-700")}>{valor}</p>
      {detalle && <p className="mt-1 text-xs text-slate-500">{detalle}</p>}
    </Card>
  );
}

export function Spinner({ texto = "Cargando…", className }: { texto?: string; className?: string }) {
  return (
    <div className={cn("flex items-center justify-center gap-2 py-10 text-sm text-slate-500", className)} role="status">
      <Loader2 className="size-4 animate-spin" aria-hidden />
      {texto}
    </div>
  );
}

export function EmptyState({ titulo, descripcion, accion }: { titulo: string; descripcion?: string; accion?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center">
      <Inbox className="size-8 text-slate-300" aria-hidden />
      <p className="text-sm font-medium text-slate-700">{titulo}</p>
      {descripcion && <p className="max-w-sm text-sm text-slate-500">{descripcion}</p>}
      {accion && <div className="mt-2">{accion}</div>}
    </div>
  );
}

export function ErrorState({ mensaje, reintentar }: { mensaje: string; reintentar?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-10 text-center" role="alert">
      <AlertTriangle className="size-7 text-red-400" aria-hidden />
      <p className="text-sm text-slate-700">{mensaje}</p>
      {reintentar && (
        <Button variante="secundario" tamano="sm" onClick={reintentar}>
          Reintentar
        </Button>
      )}
    </div>
  );
}

export function Alertas({ mensajes, titulo = "Alertas" }: { mensajes: string[]; titulo?: string }) {
  if (!mensajes.length) return null;
  return (
    <div className="rounded-md bg-amber-50 p-3 ring-1 ring-amber-200" role="status">
      <p className="flex items-center gap-1.5 text-sm font-medium text-amber-800">
        <AlertTriangle className="size-4" aria-hidden /> {titulo}
      </p>
      <ul className="mt-1.5 list-disc space-y-0.5 pl-6 text-sm text-amber-800">
        {mensajes.map((m) => (
          <li key={m}>{m}</li>
        ))}
      </ul>
    </div>
  );
}

/** Lista de definición compacta para fichas de detalle. */
export function DataList({ items }: { items: { etiqueta: string; valor: ReactNode }[] }) {
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map(({ etiqueta, valor }) => (
        <div key={etiqueta}>
          <dt className="text-xs text-slate-500">{etiqueta}</dt>
          <dd className="mt-0.5 text-sm text-slate-900">{valor}</dd>
        </div>
      ))}
    </dl>
  );
}
