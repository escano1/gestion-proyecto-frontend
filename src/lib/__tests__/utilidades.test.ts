import { describe, expect, it } from "vitest";
import { diasSemana, inicioSemana, nombreDiaCorto, sumarDias, ultimoDiaMes } from "../fechas";
import { formatoFecha, formatoPorcentaje, nombrePeriodo } from "../formato";
import { parametros } from "../api";

describe("fechas", () => {
  it("calcula el lunes de la semana", () => {
    expect(inicioSemana("2026-10-08")).toBe("2026-10-05");
    expect(inicioSemana("2026-10-11")).toBe("2026-10-05");
    expect(inicioSemana("2026-10-05")).toBe("2026-10-05");
  });

  it("recorre la semana cruzando meses", () => {
    expect(diasSemana("2026-09-28")).toEqual([
      "2026-09-28", "2026-09-29", "2026-09-30", "2026-10-01", "2026-10-02", "2026-10-03", "2026-10-04",
    ]);
    expect(nombreDiaCorto("2026-10-04")).toBe("Dom");
  });

  it("suma días y obtiene el fin de mes", () => {
    expect(sumarDias("2026-12-31", 1)).toBe("2027-01-01");
    expect(ultimoDiaMes("2028-02-10")).toBe("2028-02-29");
  });
});

describe("formato", () => {
  it("formatea fechas sin zona horaria", () => {
    expect(formatoFecha("2026-01-01")).toBe("01/01/2026");
    expect(formatoFecha(null)).toBe("—");
  });

  it("convierte fracciones a porcentaje", () => {
    expect(formatoPorcentaje(0.35)).toBe("35 %");
  });

  it("nombra periodos de nómina", () => {
    expect(nombrePeriodo({ tipoPeriodo: "QUINCENAL", anio: 2026, mes: 10, quincena: 2 })).toBe("Quincena 2 · octubre 2026");
  });
});

describe("parametros", () => {
  it("descarta filtros vacíos", () => {
    expect(parametros({ q: "", estado: "ACTIVO", id: undefined, n: 0 })).toEqual({ estado: "ACTIVO", n: 0 });
  });
});
