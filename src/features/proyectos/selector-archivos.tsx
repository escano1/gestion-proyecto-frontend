"use client";

import { useId, useRef } from "react";
import { Paperclip, X } from "lucide-react";
import { formatoTamano } from "@/lib/formato";
import { Button } from "@/components/ui/button";
import {
  ACEPTAR_ADJUNTOS,
  agregarSinDuplicados,
  MAX_ADJUNTOS_POR_ENTRADA,
  TAMANO_MAXIMO_MB,
  validarArchivos,
} from "./utilidades";

interface Props {
  archivos: File[];
  onCambiar: (archivos: File[]) => void;
  /** Adjuntos que ya tiene la entrada (cuentan para el máximo). */
  existentes?: number;
}

/** Selector múltiple con validación en cliente (cantidad, tipo y tamaño) y lista de lo seleccionado. */
export function SelectorArchivos({ archivos, onCambiar, existentes = 0 }: Props) {
  const id = useId();
  const entrada = useRef<HTMLInputElement>(null);
  const errores = validarArchivos(archivos, existentes);
  const cupo = MAX_ADJUNTOS_POR_ENTRADA - existentes;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-slate-700">Adjuntos</span>
        <Button
          variante="secundario"
          tamano="sm"
          onClick={() => entrada.current?.click()}
          disabled={cupo <= 0}
          aria-describedby={`${id}-ayuda`}
        >
          <Paperclip className="size-4" aria-hidden /> Seleccionar archivos
        </Button>
        {/* Oculto: se abre con el botón para tener un control accesible y con el estilo del sistema. */}
        <input
          ref={entrada}
          type="file"
          multiple
          accept={ACEPTAR_ADJUNTOS}
          className="hidden"
          tabIndex={-1}
          aria-hidden
          onChange={(e) => {
            const nuevos = Array.from(e.target.files ?? []);
            onCambiar(agregarSinDuplicados(archivos, nuevos));
            e.target.value = ""; // permite volver a elegir el mismo archivo tras quitarlo
          }}
        />
      </div>
      <p id={`${id}-ayuda`} className="text-xs text-slate-500">
        Hasta {cupo > 0 ? cupo : 0} archivo{cupo === 1 ? "" : "s"} de {TAMANO_MAXIMO_MB} MB: JPG, PNG, WEBP, PDF, DOCX o
        XLSX.
      </p>

      {archivos.length > 0 && (
        <ul className="divide-y divide-slate-100 rounded-md ring-1 ring-slate-200">
          {archivos.map((archivo, i) => (
            <li key={`${archivo.name}-${archivo.size}-${archivo.lastModified}`} className="flex items-center gap-2 px-3 py-1.5 text-sm">
              <span className="min-w-0 flex-1 truncate text-slate-700" title={archivo.name}>
                {archivo.name}
              </span>
              <span className="shrink-0 text-xs text-slate-500 tabular-nums">{formatoTamano(archivo.size)}</span>
              <Button
                variante="fantasma"
                tamano="sm"
                onClick={() => onCambiar(archivos.filter((_, j) => j !== i))}
                aria-label={`Quitar ${archivo.name}`}
              >
                <X className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      {errores.length > 0 && (
        <ul className="space-y-0.5 text-xs text-red-600" role="alert">
          {errores.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
