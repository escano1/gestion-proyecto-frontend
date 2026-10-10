import { describe, expect, it } from "vitest";
import { agruparParametros, rangoFechas } from "./formato-nomina";

describe("formato de nómina", () => {
  it("formatea el rango de fechas", () => {
    expect(rangoFechas("2026-10-05", "2026-10-11")).toBe("05/10/2026 – 11/10/2026");
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
