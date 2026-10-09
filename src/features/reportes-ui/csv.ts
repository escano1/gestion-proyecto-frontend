// Generación de CSV en cliente, compatible con Excel en configuración regional colombiana:
// separador ";", coma decimal y BOM UTF-8 para que se respeten las tildes.

export type CeldaCsv = string | number | boolean | null | undefined;

export const SEPARADOR_CSV = ";";
export const BOM_UTF8 = "﻿";
const FIN_LINEA = "\r\n";

const NUMERO_PLANO = /^-?\d+([.,]\d+)?$/;
const INICIO_FORMULA = /^[=+\-@\t\r]/;

function textoCelda(valor: CeldaCsv): string {
  if (valor === null || valor === undefined) return "";
  if (typeof valor === "boolean") return valor ? "Sí" : "No";
  if (typeof valor === "number") return Number.isFinite(valor) ? String(valor).replace(".", ",") : "";
  // Evita que Excel interprete texto como fórmula (inyección CSV).
  return INICIO_FORMULA.test(valor) && !NUMERO_PLANO.test(valor) ? `'${valor}` : valor;
}

/** Convierte un valor en una celda CSV escapada (comillas dobles si contiene ; " o saltos de línea). */
export function escaparCelda(valor: CeldaCsv): string {
  const texto = textoCelda(valor);
  return /[";\r\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
}

/** Arma el contenido CSV (con BOM) a partir de encabezados y filas. */
export function generarCsv(encabezados: string[], filas: CeldaCsv[][]): string {
  const lineas = [encabezados, ...filas].map((fila) => fila.map(escaparCelda).join(SEPARADOR_CSV));
  return BOM_UTF8 + lineas.join(FIN_LINEA) + FIN_LINEA;
}

/** Descarga un CSV generado en el navegador. */
export function descargarCsv(nombreArchivo: string, contenido: string): void {
  const blob = new Blob([contenido], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombreArchivo;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
