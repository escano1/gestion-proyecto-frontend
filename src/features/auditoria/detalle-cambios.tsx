"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { compararDatos, textoValor, type DiferenciaCampo, type TipoCambio } from "./diferencias";

const ESTILO_FILA: Record<TipoCambio, string> = {
  modificado: "bg-amber-50",
  agregado: "bg-emerald-50",
  eliminado: "bg-red-50",
  igual: "",
};

const ETIQUETA_CAMBIO: Record<TipoCambio, string> = {
  modificado: "Modificado",
  agregado: "Nuevo",
  eliminado: "Eliminado",
  igual: "Sin cambios",
};

function Fila({ d }: { d: DiferenciaCampo }) {
  const igual = d.tipo === "igual";
  const antes = d.tipo === "agregado" ? "—" : textoValor(d.anterior);
  const despues = d.tipo === "eliminado" ? "—" : igual ? antes : textoValor(d.nuevo);
  return (
    <tr className={ESTILO_FILA[d.tipo]}>
      <th scope="row" className="px-3 py-1.5 text-left align-top font-mono text-xs font-medium text-slate-700">
        {d.campo}
        {!igual && (
          <span className="block font-sans text-[11px] font-normal text-slate-500">{ETIQUETA_CAMBIO[d.tipo]}</span>
        )}
      </th>
      <td
        className={cn(
          "px-3 py-1.5 align-top text-xs break-all whitespace-pre-wrap",
          igual ? "text-slate-500" : "text-slate-600",
          d.tipo === "modificado" && "line-through decoration-red-400",
          d.tipo === "eliminado" && "text-red-800",
        )}
      >
        {antes}
      </td>
      <td
        className={cn(
          "px-3 py-1.5 align-top text-xs break-all whitespace-pre-wrap",
          igual ? "text-slate-500" : "font-medium text-slate-900",
        )}
      >
        {despues}
      </td>
    </tr>
  );
}

/** Campos cambiados entre los datos anteriores y nuevos; los iguales se pueden desplegar. */
export function DetalleCambios({ anteriores, nuevos }: { anteriores: Record<string, unknown> | null; nuevos: Record<string, unknown> | null }) {
  const [verIguales, setVerIguales] = useState(false);
  const diferencias = compararDatos(anteriores, nuevos);
  const cambios = diferencias.filter((d) => d.tipo !== "igual");
  const iguales = diferencias.filter((d) => d.tipo === "igual");

  if (diferencias.length === 0) {
    return <p className="text-sm text-slate-500">El registro no incluye datos de detalle.</p>;
  }

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto rounded-md ring-1 ring-slate-200">
        <table className="min-w-full divide-y divide-slate-200 bg-white text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th scope="col" className="w-48 px-3 py-1.5 text-left text-xs font-semibold text-slate-600">
                Campo
              </th>
              <th scope="col" className="px-3 py-1.5 text-left text-xs font-semibold text-slate-600">
                Antes
              </th>
              <th scope="col" className="px-3 py-1.5 text-left text-xs font-semibold text-slate-600">
                Después
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {cambios.length === 0 && (
              <tr>
                <td colSpan={3} className="px-3 py-2 text-xs text-slate-500">
                  Ningún campo cambió.
                </td>
              </tr>
            )}
            {cambios.map((d) => (
              <Fila key={d.campo} d={d} />
            ))}
            {verIguales && iguales.map((d) => <Fila key={d.campo} d={d} />)}
          </tbody>
        </table>
      </div>
      {iguales.length > 0 && (
        <button
          type="button"
          className="text-xs font-medium text-marca-700 hover:underline"
          onClick={() => setVerIguales((v) => !v)}
          aria-expanded={verIguales}
        >
          {verIguales
            ? "Ocultar campos sin cambios"
            : `Mostrar ${iguales.length} campo${iguales.length === 1 ? "" : "s"} sin cambios`}
        </button>
      )}
    </div>
  );
}
