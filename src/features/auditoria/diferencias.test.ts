import { describe, expect, it } from "vitest";
import { compararDatos, textoValor, valoresIguales } from "./diferencias";

describe("valoresIguales", () => {
  it("compara primitivos", () => {
    expect(valoresIguales("a", "a")).toBe(true);
    expect(valoresIguales("a", "b")).toBe(false);
    expect(valoresIguales(null, null)).toBe(true);
    expect(valoresIguales(null, undefined)).toBe(false);
    expect(valoresIguales(true, false)).toBe(false);
  });

  it("trata igual un número y su forma decimal en texto", () => {
    expect(valoresIguales(1500000, "1500000.00")).toBe(true);
    expect(valoresIguales("0.35", 0.35)).toBe(true);
    expect(valoresIguales(1500000, "1600000.00")).toBe(false);
    expect(valoresIguales("", 0)).toBe(false);
  });

  it("compara objetos y arreglos en profundidad", () => {
    expect(valoresIguales({ a: 1, b: [1, { c: "x" }] }, { b: [1, { c: "x" }], a: 1 })).toBe(true);
    expect(valoresIguales({ a: 1 }, { a: 1, b: 2 })).toBe(false);
    expect(valoresIguales([1, 2], [2, 1])).toBe(false);
    expect(valoresIguales({ a: 1 }, [1])).toBe(false);
  });
});

describe("compararDatos", () => {
  it("marca como agregados todos los campos de una creación", () => {
    expect(compararDatos(null, { nombre: "Ana", activo: true })).toEqual([
      { campo: "nombre", anterior: undefined, nuevo: "Ana", tipo: "agregado" },
      { campo: "activo", anterior: undefined, nuevo: true, tipo: "agregado" },
    ]);
  });

  it("marca como eliminados todos los campos de una eliminación", () => {
    expect(compararDatos({ nombre: "Ana" }, null)).toEqual([
      { campo: "nombre", anterior: "Ana", nuevo: undefined, tipo: "eliminado" },
    ]);
  });

  it("detecta campos modificados, iguales y agregados en una actualización", () => {
    const resultado = compararDatos(
      { nombre: "Ana", salarioBase: "1750905.00", cargo: "Técnica" },
      { nombre: "Ana", salarioBase: 2000000, cargo: "Técnica", email: "ana@empresa.co" },
    );
    expect(resultado.map((d) => [d.campo, d.tipo])).toEqual([
      ["nombre", "igual"],
      ["salarioBase", "modificado"],
      ["cargo", "igual"],
      ["email", "agregado"],
    ]);
  });

  it("asume sin cambios un campo ausente en los datos nuevos", () => {
    const [campo] = compararDatos({ estado: "ACTIVO" }, { otro: 1 });
    expect(campo).toEqual({ campo: "estado", anterior: "ACTIVO", nuevo: undefined, tipo: "igual" });
  });

  it("distingue un valor que pasa a null", () => {
    const [campo] = compararDatos({ fechaRetiro: "2026-10-01" }, { fechaRetiro: null });
    expect(campo.tipo).toBe("modificado");
  });

  it("devuelve una lista vacía sin datos", () => {
    expect(compararDatos(null, null)).toEqual([]);
  });
});

describe("textoValor", () => {
  it("representa cada tipo de valor", () => {
    expect(textoValor(null)).toBe("—");
    expect(textoValor(undefined)).toBe("—");
    expect(textoValor("")).toBe("—");
    expect(textoValor(false)).toBe("No");
    expect(textoValor(12.5)).toBe("12.5");
    expect(textoValor("ACTIVO")).toBe("ACTIVO");
    expect(textoValor({ a: [1, 2] })).toBe('{"a":[1,2]}');
  });
});
