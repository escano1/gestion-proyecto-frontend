"use client";

import { cn } from "@/lib/cn";

interface TabsProps<T extends string> {
  pestanas: { id: T; etiqueta: string }[];
  activa: T;
  onCambiar: (id: T) => void;
}

export function Tabs<T extends string>({ pestanas, activa, onCambiar }: TabsProps<T>) {
  return (
    <div className="mb-4 overflow-x-auto border-b border-slate-200">
      <nav className="-mb-px flex gap-4" role="tablist">
        {pestanas.map((p) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={p.id === activa}
            onClick={() => onCambiar(p.id)}
            className={cn(
              "border-b-2 px-1 py-2.5 text-sm font-medium whitespace-nowrap transition-colors",
              p.id === activa
                ? "border-marca-700 text-marca-700"
                : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700",
            )}
          >
            {p.etiqueta}
          </button>
        ))}
      </nav>
    </div>
  );
}

interface PaginationProps {
  pagina: number;
  limite: number;
  total: number;
  onCambiar: (pagina: number) => void;
}

export function Pagination({ pagina, limite, total, onCambiar }: PaginationProps) {
  const paginas = Math.max(1, Math.ceil(total / limite));
  return (
    <div className="flex items-center justify-between gap-3 border-t border-slate-200 px-3 py-2.5 text-sm text-slate-600">
      <span>
        {total} registro{total === 1 ? "" : "s"} · página {pagina} de {paginas}
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          className="rounded-md px-2.5 py-1 ring-1 ring-slate-300 hover:bg-slate-50 disabled:opacity-40"
          disabled={pagina <= 1}
          onClick={() => onCambiar(pagina - 1)}
        >
          Anterior
        </button>
        <button
          type="button"
          className="rounded-md px-2.5 py-1 ring-1 ring-slate-300 hover:bg-slate-50 disabled:opacity-40"
          disabled={pagina >= paginas}
          onClick={() => onCambiar(pagina + 1)}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
