import { describe, expect, it } from "vitest";
import { agruparParametros, periodoDesdeFechas, rangoFechas } from "./formato-nomina";

describe("formato de nómina", () => {
  it("deriva el nombre del periodo desde sus fechas", () => {
    expect(periodoDesdeFechas("QUINCENAL", "2026-10-01")).toBe("Quincena 1 · octubre 2026");
    expect(periodoDesdeFechas("QUINCENAL", "2026-10-16")).toBe("Quincena 2 · octubre 2026");
    expect(periodoDesdeFechas("MENSUAL", "2026-02-01")).toBe("Mes · febrero 2026");
    expect(rangoFechas("2026-10-01", "2026-10-15")).toBe("01/10/2026 – 15/10/2026");
  });

  it("agrupa y formatea los parámetros legales aplicados", () => {
    const grupos = agruparParametros({
      recargoNocturno: 0.35,
      smmlv: 1_423_500,
      jornadaMaximaSemanal: 44,
      aporteSaludEmpleado: 0.04,
      nuevoParametro: 3,
    });
    expect(grupos.map((g) => g.grupo)).toEqual(["Valores base", "Recargos", "Aportes del trabajador", "Otros"]);
    expect(grupos[0].items.map((i) => i.clave)).toEqual(["smmlv", "jornadaMaximaSemanal"]);
    expect(grupos[0].items[1].valor).toBe("44 h");
    expect(grupos[1].items[0]).toMatchObject({ etiqueta: "Nocturno", valor: "35 %" });
    expect(grupos[3].items[0]).toMatchObject({ etiqueta: "nuevoParametro", valor: "3" });
  });
});
