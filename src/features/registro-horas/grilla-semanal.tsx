"use client";

import { useMemo, useRef, type KeyboardEvent } from "react";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatoFecha, formatoHoras, formatoNumero } from "@/lib/formato";
import { nombreDiaCorto } from "@/lib/fechas";
import { Checkbox } from "@/components/ui/form-controls";
import {
  calcularTotales,
  claveCelda,
  diaEditable,
  fechaEnRangos,
  leerHoras,
  nombreDiaLargo,
  tiposConDatos,
  type Celdas,
  type FilaTrabajador,
  type TipoGrilla,
} from "./grilla";

const diaMes = (fecha: string) => formatoFecha(fecha).slice(0, 5);

interface SelectorTiposProps {
  tipos: TipoGrilla[];
  visibles: ReadonlySet<string>;
  onCambiar: (codigo: string, visible: boolean) => void;
}

/** Casillas para elegir qué tipos de hora se muestran en la grilla. */
export function SelectorTipos({ tipos, visibles, onCambiar }: SelectorTiposProps) {
  return (
    <fieldset className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <legend className="sr-only">Tipos de hora visibles</legend>
      <span className="text-xs font-medium text-slate-500" aria-hidden>
        Tipos visibles:
      </span>
      {tipos.map((t) => (
        <label key={t.id} className="flex items-center gap-1.5 text-sm text-slate-700" title={t.nombre}>
          <Checkbox checked={visibles.has(t.codigo)} onChange={(e) => onCambiar(t.codigo, e.target.checked)} />
          <span className="font-medium">{t.codigo}</span>
          <span className="sr-only">{t.nombre}</span>
        </label>
      ))}
    </fieldset>
  );
}

interface GrillaProps {
  dias: string[];
  hoy: string;
  trabajadores: FilaTrabajador[];
  tipos: TipoGrilla[];
  codigosVisibles: ReadonlySet<string>;
  base: Celdas;
  actual: Celdas;
  invalidas: ReadonlySet<string>;
  editable: boolean;
  limiteExtraDia: number;
  limiteExtraSemana: number;
  /** `entradaInvalida`: el navegador no pudo interpretar lo digitado como número. */
  onCambiar: (clave: string, texto: string, entradaInvalida: boolean) => void;
}

/**
 * Grilla semanal: un bloque por trabajador con una fila por tipo de hora y una columna por día.
 * Teclado: Tab avanza por la semana, Enter / Mayús+Enter bajan o suben al mismo día, ↑/↓ suman o restan 0,5 h.
 */
export function GrillaSemanal({
  dias,
  hoy,
  trabajadores,
  tipos,
  codigosVisibles,
  base,
  actual,
  invalidas,
  editable,
  limiteExtraDia,
  limiteExtraSemana,
  onCambiar,
}: GrillaProps) {
  const tablaRef = useRef<HTMLTableElement>(null);
  const tiposExtra = useMemo(() => new Set(tipos.filter((t) => t.esExtra).map((t) => t.id)), [tipos]);
  const totales = useMemo(() => calcularTotales(actual, tiposExtra), [actual, tiposExtra]);
  const conDatos = useMemo(() => tiposConDatos(base, actual), [base, actual]);

  const moverVerticalmente = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const columna = e.currentTarget.dataset.col;
    const celdas = [...(tablaRef.current?.querySelectorAll<HTMLInputElement>(`input[data-col="${columna}"]`) ?? [])];
    const paso = e.shiftKey ? -1 : 1;
    for (let i = celdas.indexOf(e.currentTarget) + paso; i >= 0 && i < celdas.length; i += paso) {
      if (!celdas[i].disabled) {
        celdas[i].focus();
        return;
      }
    }
  };

  return (
    <div className="overflow-x-auto">
      <table ref={tablaRef} className="min-w-full border-separate border-spacing-0 text-sm">
        <caption className="sr-only">Horas por trabajador, tipo de hora y día de la semana</caption>
        {trabajadores.map((trabajador) => {
          const t = totales.get(trabajador.id);
          const tiposTrabajador = conDatos.get(trabajador.id);
          const filas = tipos.filter((tipo) => codigosVisibles.has(tipo.codigo) || tiposTrabajador?.has(tipo.id));
          const habilitados = dias.map((fecha) => diaEditable(fecha, trabajador.rangos, hoy));
          const cubreSemana = dias.every((fecha) => fechaEnRangos(fecha, trabajador.rangos));
          const extraSemana = (t?.extra ?? 0) > limiteExtraSemana;

          return (
            <tbody key={trabajador.id} className="[&>tr>*]:border-b [&>tr>*]:border-slate-100">
              <tr className="bg-slate-50">
                <th
                  scope="rowgroup"
                  className="sticky left-0 z-10 min-w-48 max-w-64 bg-slate-50 px-3 py-2 text-left align-bottom"
                >
                  <span className="block truncate font-semibold text-slate-900" title={trabajador.nombre}>
                    {trabajador.nombre}
                  </span>
                  <span className="block truncate text-xs font-normal text-slate-500">
                    {[trabajador.cargo, trabajador.numeroDocumento].filter(Boolean).join(" · ")}
                  </span>
                  {trabajador.rangos.length === 0 ? (
                    <span className="block text-xs font-normal text-amber-700">Sin asignación en la semana</span>
                  ) : (
                    !cubreSemana && (
                      <span className="block text-xs font-normal text-slate-500">
                        Asignado:{" "}
                        {trabajador.rangos
                          .map((r) => `${formatoFecha(r.fechaInicio)} – ${r.fechaFin ? formatoFecha(r.fechaFin) : "…"}`)
                          .join(", ")}
                      </span>
                    )
                  )}
                </th>
                {dias.map((fecha) => (
                  <th
                    key={fecha}
                    scope="col"
                    className={cn(
                      "px-1 py-2 text-center text-xs font-medium whitespace-nowrap",
                      fecha === hoy ? "text-marca-700" : fecha > hoy ? "text-slate-400" : "text-slate-600",
                    )}
                  >
                    {nombreDiaCorto(fecha)} {diaMes(fecha)}
                  </th>
                ))}
                <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-slate-600">
                  Semana
                </th>
              </tr>

              {filas.map((tipo) => (
                <tr key={tipo.id}>
                  <th
                    scope="row"
                    className="sticky left-0 z-10 max-w-64 bg-white px-3 py-1 text-left font-normal"
                    title={tipo.nombre}
                  >
                    <span className="font-medium text-slate-800">{tipo.codigo}</span>
                    <span className="ml-1.5 hidden truncate text-xs text-slate-500 sm:inline">{tipo.nombre}</span>
                    {!tipo.activo && <span className="ml-1 text-xs text-amber-700">(inactivo)</span>}
                  </th>
                  {dias.map((fecha, i) => {
                    const clave = claveCelda(trabajador.id, fecha, tipo.id);
                    const texto = actual[clave] ?? "";
                    const invalida = invalidas.has(clave);
                    const modificada = leerHoras(base[clave]) !== leerHoras(texto);
                    return (
                      <td key={fecha} className="px-1 py-1 text-center">
                        <input
                          type="number"
                          inputMode="decimal"
                          min={0}
                          max={24}
                          step={0.5}
                          value={texto}
                          disabled={!editable || !habilitados[i]}
                          onChange={(e) => onCambiar(clave, e.target.value, e.target.validity.badInput)}
                          onFocus={(e) => e.currentTarget.select()}
                          onKeyDown={moverVerticalmente}
                          data-col={i}
                          aria-label={`${trabajador.nombre}, ${tipo.codigo}, ${nombreDiaLargo(i)} ${diaMes(fecha)}`}
                          aria-invalid={invalida || undefined}
                          className={cn(
                            "h-8 w-14 rounded-md border-0 bg-white px-1.5 text-right text-sm tabular-nums ring-1 ring-slate-300 ring-inset",
                            "focus:ring-2 focus:ring-marca-600 focus:outline-none",
                            "disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 disabled:ring-slate-200",
                            modificada && "bg-marca-50 ring-marca-500",
                            invalida && "bg-red-50 ring-2 ring-red-500",
                          )}
                        />
                      </td>
                    );
                  })}
                  <td className="px-3 py-1 text-right text-slate-600 tabular-nums">
                    {t?.porTipo[tipo.id] ? formatoNumero(t.porTipo[tipo.id]) : "—"}
                  </td>
                </tr>
              ))}

              <tr>
                <th scope="row" className="sticky left-0 z-10 bg-white px-3 py-1.5 text-left text-xs font-semibold text-slate-600">
                  Total del día
                </th>
                {dias.map((fecha) => {
                  const dia = t?.porDia[fecha];
                  const excede = (dia?.extra ?? 0) > limiteExtraDia;
                  return (
                    <td
                      key={fecha}
                      className={cn(
                        "px-1 py-1.5 text-center text-xs font-semibold tabular-nums",
                        excede ? "bg-amber-100 text-amber-900" : "text-slate-700",
                      )}
                      title={excede ? `${formatoHoras(dia?.extra)} extra (límite ${formatoHoras(limiteExtraDia)})` : undefined}
                    >
                      <span className="inline-flex items-center gap-0.5">
                        {excede && <AlertTriangle className="size-3" aria-hidden />}
                        {dia?.total ? formatoNumero(dia.total) : "—"}
                      </span>
                      {excede && <span className="sr-only">: {formatoHoras(dia?.extra)} extra, supera el límite diario</span>}
                    </td>
                  );
                })}
                <td
                  className={cn(
                    "px-3 py-1.5 text-right text-xs font-semibold whitespace-nowrap tabular-nums",
                    extraSemana ? "bg-amber-100 text-amber-900" : "text-slate-900",
                  )}
                  title={
                    t?.extra
                      ? `${formatoHoras(t.extra)} extra en la semana (límite ${formatoHoras(limiteExtraSemana)})`
                      : undefined
                  }
                >
                  {formatoHoras(t?.total ?? 0)}
                  {t?.extra ? <span className="block font-normal">{formatoHoras(t.extra)} extra</span> : null}
                </td>
              </tr>
            </tbody>
          );
        })}
      </table>
    </div>
  );
}
