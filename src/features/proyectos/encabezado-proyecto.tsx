"use client";

import { CalendarDays, MapPin, Pencil, UserRound } from "lucide-react";
import { formatoFecha, formatoPesos } from "@/lib/formato";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/display";
import { EstadoBadge } from "@/components/ui/estado-badge";
import type { Proyecto } from "@/types/api";

interface Props {
  proyecto: Proyecto;
  onEditar?: () => void;
}

/** Ficha superior del detalle: identificación, cliente, ubicación, fechas, presupuesto y estado. */
export function EncabezadoProyecto({ proyecto: p, onEditar }: Props) {
  return (
    <Card className="mb-6 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs font-medium text-slate-700">{p.codigo}</span>
            <EstadoBadge dominio="proyecto" estado={p.estado} />
          </div>
          <h1 className="mt-2 text-xl font-semibold tracking-tight text-slate-900">{p.nombre}</h1>
          <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-600">
            <li className="flex items-center gap-1.5">
              <UserRound className="size-4 text-slate-400" aria-hidden />
              <span className="sr-only">Cliente:</span>
              {p.cliente}
            </li>
            <li className="flex items-center gap-1.5">
              <MapPin className="size-4 text-slate-400" aria-hidden />
              <span className="sr-only">Ubicación:</span>
              {p.ubicacion}
            </li>
            <li className="flex items-center gap-1.5">
              <CalendarDays className="size-4 text-slate-400" aria-hidden />
              <span>
                {formatoFecha(p.fechaInicio)} → {p.fechaFinPlaneada ? formatoFecha(p.fechaFinPlaneada) : "sin fecha de fin"}
                {p.fechaFinReal && <span className="text-slate-500"> (finalizó {formatoFecha(p.fechaFinReal)})</span>}
              </span>
            </li>
          </ul>
        </div>
        <div className="flex flex-col items-start gap-3 sm:items-end">
          {onEditar && (
            <Button variante="secundario" onClick={onEditar}>
              <Pencil className="size-4" /> Editar
            </Button>
          )}
          <div className="sm:text-right">
            <p className="text-xs text-slate-500">Presupuesto</p>
            <p className="text-lg font-semibold text-slate-900">{formatoPesos(p.presupuesto)}</p>
          </div>
        </div>
      </div>
      {p.descripcion && <p className="mt-4 border-t border-slate-100 pt-3 text-sm whitespace-pre-line text-slate-600">{p.descripcion}</p>}
    </Card>
  );
}
