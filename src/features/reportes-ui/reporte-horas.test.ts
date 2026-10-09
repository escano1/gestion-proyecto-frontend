import { describe, expect, it } from "vitest";
import type { ReporteHoras } from "@/types/api";
import { etiquetaFila, tablaCsvHoras, tiposPresentes, totalesPorTipo } from "./reporte-horas";

const reporte: ReporteHoras = {
  desde: "2026-10-01",
  hasta: "2026-10-31",
  agrupacion: "trabajador",
  filas: [
    { clave: "1", etiqueta: "Ana Pérez", horas: 10, horasExtra: 2, costo: 150000.5, porTipo: { HED: 2, ORD: 8 } },
    { clave: "2", etiqueta: "Luis Gómez", horas: 8.5, horasExtra: 0, costo: 120000, porTipo: { ORD: 8.25, NOC: 0.25 } },
  ],
  totales: { horas: 18.5, horasExtra: 2, costo: 270000.5 },
};

describe("reporte de horas", () => {
  it("lista los tipos presentes en el orden del catálogo", () => {
    expect(tiposPresentes(reporte.filas)).toEqual(["ORD", "NOC", "HED"]);
    expect(tiposPresentes([])).toEqual([]);
  });

  it("suma las horas por tipo", () => {
    expect(totalesPorTipo(reporte.filas, ["ORD", "NOC", "HED"])).toEqual({ ORD: 16.25, NOC: 0.25, HED: 2 });
  });

  it("formatea etiquetas de fecha", () => {
    expect(etiquetaFila("2026-10-08")).toBe("08/10/2026");
    expect(etiquetaFila("Ana Pérez")).toBe("Ana Pérez");
  });

  it("arma la tabla del CSV con totales", () => {
    const { encabezados, filas } = tablaCsvHoras(reporte, (c) => (c === "ORD" ? "Ordinaria" : c));
    expect(encabezados).toEqual(["Trabajador", "ORD - Ordinaria", "NOC", "HED", "Horas", "Horas extra", "Costo (COP)"]);
    expect(filas[0]).toEqual(["Ana Pérez", 8, 0, 2, 10, 2, 150000.5]);
    expect(filas.at(-1)).toEqual(["Total", 16.25, 0.25, 2, 18.5, 2, 270000.5]);
  });
});
