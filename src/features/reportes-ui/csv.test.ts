import { describe, expect, it } from "vitest";
import { BOM_UTF8, escaparCelda, generarCsv } from "./csv";

describe("escaparCelda", () => {
  it("deja intacto el texto simple", () => {
    expect(escaparCelda("Ana Pérez")).toBe("Ana Pérez");
  });

  it("encierra en comillas el texto con punto y coma", () => {
    expect(escaparCelda("Obra; fase 2")).toBe('"Obra; fase 2"');
  });

  it("duplica las comillas internas", () => {
    expect(escaparCelda('Tablero "TG-1"')).toBe('"Tablero ""TG-1"""');
  });

  it("encierra en comillas los saltos de línea", () => {
    expect(escaparCelda("línea 1\nlínea 2")).toBe('"línea 1\nlínea 2"');
    expect(escaparCelda("a\r\nb")).toBe('"a\r\nb"');
  });

  it("usa coma decimal en los números", () => {
    expect(escaparCelda(7.5)).toBe("7,5");
    expect(escaparCelda(1250000)).toBe("1250000");
    expect(escaparCelda(-3.25)).toBe("-3,25");
    expect(escaparCelda(Number.NaN)).toBe("");
  });

  it("convierte vacíos y booleanos", () => {
    expect(escaparCelda(null)).toBe("");
    expect(escaparCelda(undefined)).toBe("");
    expect(escaparCelda(true)).toBe("Sí");
    expect(escaparCelda(false)).toBe("No");
  });

  it("neutraliza texto que Excel interpretaría como fórmula", () => {
    expect(escaparCelda("=SUMA(A1)")).toBe("'=SUMA(A1)");
    expect(escaparCelda("@usuario")).toBe("'@usuario");
    expect(escaparCelda("-12")).toBe("-12");
  });
});

describe("generarCsv", () => {
  it("antepone el BOM UTF-8 y separa con punto y coma", () => {
    const csv = generarCsv(["Trabajador", "Horas"], [["Ana", 8], ["Luis; Jr.", 7.5]]);
    expect(csv.startsWith(BOM_UTF8)).toBe(true);
    expect(csv.slice(1)).toBe('Trabajador;Horas\r\nAna;8\r\n"Luis; Jr.";7,5\r\n');
  });

  it("genera solo encabezados cuando no hay filas", () => {
    expect(generarCsv(["A", "B"], [])).toBe(`${BOM_UTF8}A;B\r\n`);
  });
});
