"use client";

import { useId } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form-controls";
import { inicioSemana, sumarDias } from "@/lib/fechas";
import { formatoFecha } from "@/lib/formato";

interface Props {
  lunes: string;
  hoy: string;
  onCambiar: (lunes: string) => void;
}

/** Navegación por semanas (lunes a domingo). La fecha elegida se normaliza al lunes. */
export function SelectorSemana({ lunes, hoy, onCambiar }: Props) {
  const id = useId();
  const semanaActual = inicioSemana(hoy);
  const siguiente = sumarDias(lunes, 7);

  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">
        Semana
      </label>
      <div className="flex flex-wrap items-center gap-1.5">
        <Button variante="secundario" onClick={() => onCambiar(sumarDias(lunes, -7))} aria-label="Semana anterior" className="px-2">
          <ChevronLeft className="size-4" />
        </Button>
        <Input
          id={id}
          type="date"
          className="w-40"
          value={lunes}
          max={hoy}
          onChange={(e) => e.target.value && onCambiar(inicioSemana(e.target.value))}
          aria-describedby={`${id}-rango`}
        />
        <Button
          variante="secundario"
          onClick={() => onCambiar(siguiente)}
          disabled={siguiente > semanaActual}
          aria-label="Semana siguiente"
          className="px-2"
        >
          <ChevronRight className="size-4" />
        </Button>
        <Button variante="fantasma" onClick={() => onCambiar(semanaActual)} disabled={lunes === semanaActual}>
          Semana actual
        </Button>
        <span id={`${id}-rango`} className="text-sm whitespace-nowrap text-slate-500">
          {formatoFecha(lunes)} – {formatoFecha(sumarDias(lunes, 6))}
        </span>
      </div>
    </div>
  );
}
