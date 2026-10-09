import { describe, expect, it } from "vitest";
import type { ParametroLegal } from "@/types/api";
import { agruparPorCodigo, aValorApi, formatoValorParametro } from "./parametros";

const parametro = (p: Partial<ParametroLegal> & Pick<ParametroLegal, "id" | "codigo" | "vigenteDesde">): ParametroLegal => ({
  nombre: p.codigo,
  unidad: "PESOS",
  valor: 1,
  norma: null,
  creadoEn: "2026-01-01T00:00:00.000Z",
  ...p,
});

describe("parámetros legales", () => {
  it("convierte porcentajes a fracción solo para FRACCION", () => {
    expect(aValorApi(90, "FRACCION")).toBe(0.9);
    expect(aValorApi(12.5, "FRACCION")).toBe(0.125);
    expect(aValorApi(35, "FRACCION")).toBe(0.35);
    expect(aValorApi(1750905, "PESOS")).toBe(1750905);
    expect(aValorApi(42, "HORAS")).toBe(42);
  });

  it("formatea según la unidad", () => {
    expect(formatoValorParametro(0.35, "FRACCION")).toBe("35 %");
    expect(formatoValorParametro(42, "HORAS")).toBe("42 h");
    expect(formatoValorParametro(1423500, "PESOS")).toContain("1.423.500");
  });

  it("agrupa por código en orden del catálogo y marca la vigencia aplicable", () => {
    const grupos = agruparPorCodigo(
      [
        parametro({ id: 1, codigo: "UVT", vigenteDesde: "2026-01-01" }),
        parametro({ id: 2, codigo: "SMMLV", vigenteDesde: "2025-01-01" }),
        parametro({ id: 3, codigo: "SMMLV", vigenteDesde: "2027-01-01" }),
        parametro({ id: 4, codigo: "SMMLV", vigenteDesde: "2026-01-01" }),
      ],
      "2026-10-08",
    );
    expect(grupos.map((g) => g.codigo)).toEqual(["SMMLV", "UVT"]);
    expect(grupos[0].vigencias.map((v) => v.id)).toEqual([3, 4, 2]);
    expect(grupos[0].idVigente).toBe(4);
  });

  it("no marca vigencia si todas son futuras", () => {
    const [grupo] = agruparPorCodigo([parametro({ id: 9, codigo: "UVT", vigenteDesde: "2027-01-01" })], "2026-10-08");
    expect(grupo.idVigente).toBeNull();
  });
});
