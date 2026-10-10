import { describe, expect, it } from "vitest";
import {
  etiquetaEnLineas,
  filtrarProyectos,
  porcentajeEjecucion,
  tieneMaxDosDecimales,
} from "./utilidades";


describe("filtrarProyectos", () => {
  const proyectos = [
    { codigo: "PRY-001", nombre: "Subestación Norte", cliente: "Energía Andina" },
    { codigo: "PRY-002", nombre: "Iluminación vial", cliente: "Municipio de Rionegro" },
  ];

  it("devuelve todo con texto vacío", () => {
    expect(filtrarProyectos(proyectos, "  ")).toHaveLength(2);
  });

  it("busca por código, nombre o cliente sin tildes ni mayúsculas", () => {
    expect(filtrarProyectos(proyectos, "pry-002")).toEqual([proyectos[1]]);
    expect(filtrarProyectos(proyectos, "subestacion")).toEqual([proyectos[0]]);
    expect(filtrarProyectos(proyectos, "ENERGIA")).toEqual([proyectos[0]]);
    expect(filtrarProyectos(proyectos, "iluminación")).toEqual([proyectos[1]]);
  });

  it("sin coincidencias devuelve vacío", () => {
    expect(filtrarProyectos(proyectos, "xyz")).toEqual([]);
  });
});

describe("etiquetaEnLineas", () => {
  it("quita el prefijo 'Hora' y conserva nombres cortos en una línea", () => {
    expect(etiquetaEnLineas("Hora ordinaria")).toEqual(["Ordinaria"]);
    expect(etiquetaEnLineas("Recargo nocturno")).toEqual(["Recargo nocturno"]);
  });

  it("parte nombres largos en dos líneas parejas sin cortar palabras", () => {
    expect(etiquetaEnLineas("Hora extra dominical/festiva nocturna")).toEqual(["Extra dominical/", "festiva nocturna"]);
    expect(etiquetaEnLineas("Hora dominical/festiva nocturna")).toEqual(["Dominical/", "festiva nocturna"]);
    expect(etiquetaEnLineas("Hora extra nocturna en jornada especial")).toEqual(["Extra nocturna en", "jornada especial"]);
  });

  it("no parte una sola palabra larga", () => {
    expect(etiquetaEnLineas("Electromecánicaespecializadaextra")).toEqual(["Electromecánicaespecializadaextra"]);
  });
});

describe("números y presupuesto", () => {
  it("valida máximo dos decimales sin errores de punto flotante", () => {
    expect(tieneMaxDosDecimales(10)).toBe(true);
    expect(tieneMaxDosDecimales(0.07)).toBe(true);
    expect(tieneMaxDosDecimales(12.35)).toBe(true);
    expect(tieneMaxDosDecimales(1.005)).toBe(false);
  });

  it("calcula el porcentaje de ejecución del presupuesto", () => {
    expect(porcentajeEjecucion(2_500_000, 10_000_000)).toBe(25);
    expect(porcentajeEjecucion(12_000_000, 10_000_000)).toBe(120);
    expect(porcentajeEjecucion(1_000, null)).toBeNull();
    expect(porcentajeEjecucion(1_000, 0)).toBeNull();
  });
});

