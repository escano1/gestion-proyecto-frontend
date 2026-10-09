"use client";

import type { ReactNode } from "react";
import { Field, Input } from "@/components/ui/form-controls";
import type { RangoFechas } from "@/features/reportes/api";

/** Franja de filtros en la parte superior de una tarjeta. */
export function BarraFiltros({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-end gap-3 border-b border-slate-200 p-3">{children}</div>;
}

/**
 * Rango de fechas siempre válido: al mover un extremo más allá del otro, el otro se ajusta.
 * Un campo vaciado se ignora (el API exige ambas fechas).
 */
export function FiltroRango({ rango, onCambiar }: { rango: RangoFechas; onCambiar: (rango: RangoFechas) => void }) {
  return (
    <>
      <Field label="Desde" className="w-full sm:w-40">
        {(id) => (
          <Input
            id={id}
            type="date"
            value={rango.desde}
            onChange={(e) => {
              const desde = e.target.value;
              if (desde) onCambiar({ desde, hasta: desde > rango.hasta ? desde : rango.hasta });
            }}
          />
        )}
      </Field>
      <Field label="Hasta" className="w-full sm:w-40">
        {(id) => (
          <Input
            id={id}
            type="date"
            value={rango.hasta}
            onChange={(e) => {
              const hasta = e.target.value;
              if (hasta) onCambiar({ desde: hasta < rango.desde ? hasta : rango.desde, hasta });
            }}
          />
        )}
      </Field>
    </>
  );
}
