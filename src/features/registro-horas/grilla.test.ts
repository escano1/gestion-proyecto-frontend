import { describe, expect, it } from "vitest";
import type { Asignacion, CodigoTipoHora, RegistroHoras, TipoHora } from "@/types/api";
import {
  armarLote,
  calcularTotales,
  celdasDesdeRegistros,
  celdasInvalidas,
  claveCelda,
  combinarCeldas,
  descartarGuardadas,
  diaEditable,
  horasValidas,
  leerHoras,
  paresModificados,
  resumenLote,
  tiposConDatos,
  tiposDeGrilla,
  trabajadoresGrilla,
} from "./grilla";

const ORD = 1;
const HED = 3;
const DOM = 5;

function registro(
  trabajadorId: number,
  fecha: string,
  detalles: [number, CodigoTipoHora, number][],
  nombre = `Trabajador ${trabajadorId}`,
): RegistroHoras {
  return {
    id: trabajadorId * 100 + Number(fecha.slice(-2)),
    fecha,
    observacion: null,
    trabajador: { id: trabajadorId, nombre, numeroDocumento: String(trabajadorId) },
    proyecto: { id: 7, codigo: "P-7", nombre: "Subestación" },
    detalles: detalles.map(([tipoHoraId, codigo, horas]) => ({ tipoHoraId, codigo, nombre: codigo, horas })),
    totalHoras: detalles.reduce((s, [, , h]) => s + h, 0),
    creadoPor: { id: 1, nombre: "Admin" },
    actualizadoPor: null,
    creadoEn: "2026-10-06T12:00:00Z",
    actualizadoEn: "2026-10-06T12:00:00Z",
  };
}

function tipo(id: number, codigo: CodigoTipoHora, extra: Partial<TipoHora> = {}): TipoHora {
  return {
    id,
    codigo,
    nombre: codigo,
    descripcion: null,
    esExtra: codigo.startsWith("HE"),
    esNocturna: false,
    esDominicalFestiva: false,
    orden: id,
    activo: true,
    recargo: 0,
    ...extra,
  };
}

function asignacion(trabajadorId: number, nombre: string): Asignacion {
  return {
    id: trabajadorId * 10,
    trabajadorId,
    proyectoId: 7,
    rolEnProyecto: null,
    trabajador: { id: trabajadorId, nombre, numeroDocumento: String(trabajadorId), cargo: "Electricista" },
    proyecto: { id: 7, codigo: "P-7", nombre: "Subestación" },
    creadoEn: "2026-01-01T00:00:00Z",
  };
}

describe("lectura y validación de horas", () => {
  it("interpreta vacío como 0 y admite coma decimal", () => {
    expect(leerHoras("")).toBe(0);
    expect(leerHoras(undefined)).toBe(0);
    expect(leerHoras(" 7,5 ")).toBe(7.5);
    expect(leerHoras("8")).toBe(8);
    expect(leerHoras("abc")).toBeNull();
  });

  it("valida rango 0–24 y máximo 2 decimales", () => {
    expect(horasValidas("0")).toBe(true);
    expect(horasValidas("24")).toBe(true);
    expect(horasValidas("0.25")).toBe(true);
    expect(horasValidas("24.5")).toBe(false);
    expect(horasValidas("-1")).toBe(false);
    expect(horasValidas("1.255")).toBe(false);
    expect(horasValidas("x")).toBe(false);
  });

  it("lista las celdas inválidas", () => {
    const celdas = { [claveCelda(1, "2026-10-05", ORD)]: "8", [claveCelda(1, "2026-10-06", ORD)]: "30" };
    expect(celdasInvalidas(celdas)).toEqual([claveCelda(1, "2026-10-06", ORD)]);
  });
});

describe("estado de la grilla", () => {
  const registros = [
    registro(1, "2026-10-05", [
      [ORD, "ORD", 8],
      [HED, "HED", 2],
    ]),
    registro(2, "2026-10-06", [[ORD, "ORD", 7.5]]),
  ];

  it("construye las celdas desde los registros", () => {
    expect(celdasDesdeRegistros(registros)).toEqual({
      [claveCelda(1, "2026-10-05", ORD)]: "8",
      [claveCelda(1, "2026-10-05", HED)]: "2",
      [claveCelda(2, "2026-10-06", ORD)]: "7.5",
    });
  });

  it("sin ediciones no hay pares modificados", () => {
    const base = celdasDesdeRegistros(registros);
    expect(paresModificados(base, combinarCeldas(base, {}))).toEqual([]);
  });

  it("ignora diferencias solo de formato (8 vs 8,0; vacío vs 0)", () => {
    const base = celdasDesdeRegistros(registros);
    const actual = combinarCeldas(base, {
      [claveCelda(1, "2026-10-05", ORD)]: "8,0",
      [claveCelda(1, "2026-10-07", ORD)]: "0",
      [claveCelda(2, "2026-10-07", ORD)]: "",
    });
    expect(paresModificados(base, actual)).toEqual([]);
  });

  it("detecta pares modificados ordenados por fecha y trabajador", () => {
    const base = celdasDesdeRegistros(registros);
    const actual = combinarCeldas(base, {
      [claveCelda(2, "2026-10-06", ORD)]: "8",
      [claveCelda(1, "2026-10-06", ORD)]: "4",
      [claveCelda(1, "2026-10-05", HED)]: "",
    });
    expect(paresModificados(base, actual)).toEqual([
      { trabajadorId: 1, fecha: "2026-10-05" },
      { trabajadorId: 1, fecha: "2026-10-06" },
      { trabajadorId: 2, fecha: "2026-10-06" },
    ]);
  });
});

describe("armado del lote", () => {
  const registros = [
    registro(1, "2026-10-05", [
      [ORD, "ORD", 8],
      [HED, "HED", 2],
    ]),
    registro(1, "2026-10-06", [[ORD, "ORD", 8]]),
  ];
  const base = celdasDesdeRegistros(registros);

  it("incluye todos los tipos de la fecha modificada aunque no hayan cambiado", () => {
    const actual = combinarCeldas(base, { [claveCelda(1, "2026-10-05", HED)]: "3" });
    expect(armarLote(base, actual, 7)).toEqual([
      {
        trabajadorId: 1,
        proyectoId: 7,
        fecha: "2026-10-05",
        detalles: [
          { tipoHoraId: ORD, horas: 8 },
          { tipoHoraId: HED, horas: 3 },
        ],
      },
    ]);
  });

  it("omite los tipos en 0 y no envía fechas sin cambios", () => {
    const actual = combinarCeldas(base, {
      [claveCelda(1, "2026-10-05", HED)]: "0",
      [claveCelda(1, "2026-10-07", DOM)]: "",
    });
    expect(armarLote(base, actual, 7)).toEqual([
      { trabajadorId: 1, proyectoId: 7, fecha: "2026-10-05", detalles: [{ tipoHoraId: ORD, horas: 8 }] },
    ]);
  });

  it("envía detalles vacíos si todo queda en 0 (el API elimina el registro)", () => {
    const actual = combinarCeldas(base, { [claveCelda(1, "2026-10-06", ORD)]: "" });
    expect(armarLote(base, actual, 7)).toEqual([
      { trabajadorId: 1, proyectoId: 7, fecha: "2026-10-06", detalles: [] },
    ]);
  });

  it("crea registros nuevos con coma decimal", () => {
    const actual = combinarCeldas(base, {
      [claveCelda(2, "2026-10-07", ORD)]: "7,5",
      [claveCelda(2, "2026-10-07", DOM)]: "1",
    });
    expect(armarLote(base, actual, 7)).toEqual([
      {
        trabajadorId: 2,
        proyectoId: 7,
        fecha: "2026-10-07",
        detalles: [
          { tipoHoraId: ORD, horas: 7.5 },
          { tipoHoraId: DOM, horas: 1 },
        ],
      },
    ]);
  });

  it("resume el resultado del guardado", () => {
    expect(resumenLote({ creados: 2, actualizados: 1, eliminados: 0, alertas: [] })).toBe(
      "Registros guardados: 2 creados, 1 actualizado",
    );
    expect(resumenLote({ creados: 0, actualizados: 0, eliminados: 0, alertas: [] })).toBe("No había cambios por guardar");
  });

  it("tras guardar conserva solo lo digitado durante el guardado", () => {
    const enviadas = { a: "8", b: "2" };
    expect(descartarGuardadas({ a: "8", b: "3", c: "1" }, enviadas)).toEqual({ b: "3", c: "1" });
  });
});

describe("totales", () => {
  it("suma por día, por tipo y por semana separando las horas extra", () => {
    const celdas = {
      [claveCelda(1, "2026-10-05", ORD)]: "8",
      [claveCelda(1, "2026-10-05", HED)]: "2,5",
      [claveCelda(1, "2026-10-06", ORD)]: "8",
      [claveCelda(1, "2026-10-06", HED)]: "x",
      [claveCelda(2, "2026-10-06", ORD)]: "4",
    };
    const totales = calcularTotales(celdas, new Set([HED]));
    expect(totales.get(1)).toEqual({
      porDia: { "2026-10-05": { total: 10.5, extra: 2.5 }, "2026-10-06": { total: 8, extra: 0 } },
      porTipo: { [ORD]: 16, [HED]: 2.5 },
      total: 18.5,
      extra: 2.5,
    });
    expect(totales.get(2)?.total).toBe(4);
    expect(totales.get(3)).toBeUndefined();
  });

  it("identifica los tipos con datos por trabajador en varias fuentes", () => {
    const base = { [claveCelda(1, "2026-10-05", DOM)]: "4" };
    const actual = { [claveCelda(1, "2026-10-05", DOM)]: "", [claveCelda(2, "2026-10-06", HED)]: "1" };
    const resultado = tiposConDatos(base, actual);
    expect([...(resultado.get(1) ?? [])]).toEqual([DOM]);
    expect([...(resultado.get(2) ?? [])]).toEqual([HED]);
  });
});

describe("días editables y filas de la grilla", () => {
  it("permite toda la semana en curso y bloquea semanas futuras y trabajadores sin asignación", () => {
    expect(diaEditable("2026-10-07", true, "2026-10-08")).toBe(true);
    expect(diaEditable("2026-10-10", true, "2026-10-08")).toBe(true); // sábado
    expect(diaEditable("2026-10-11", true, "2026-10-08")).toBe(true); // domingo
    expect(diaEditable("2026-10-12", true, "2026-10-08")).toBe(false);
    expect(diaEditable("2026-10-07", false, "2026-10-08")).toBe(false);
  });

  it("lista a los asignados, agrega quienes tienen registros sin asignación y ordena por nombre", () => {
    const filas = trabajadoresGrilla(
      [asignacion(1, "Zuluaga Pedro"), asignacion(2, "Álvarez Ana"), asignacion(1, "Zuluaga Pedro")],
      [registro(3, "2026-10-05", [[ORD, "ORD", 8]], "Martínez Luis")],
    );
    expect(filas.map((f) => [f.nombre, f.asignado])).toEqual([
      ["Álvarez Ana", true],
      ["Martínez Luis", false],
      ["Zuluaga Pedro", true],
    ]);
  });

  it("incluye tipos inactivos solo si tienen horas registradas", () => {
    const catalogo = [tipo(ORD, "ORD"), tipo(HED, "HED"), tipo(8, "HEDN", { activo: false, orden: 8 })];
    expect(tiposDeGrilla(catalogo, []).map((t) => t.codigo)).toEqual(["ORD", "HED"]);
    const conInactivo = tiposDeGrilla(catalogo, [registro(1, "2026-10-05", [[8, "HEDN", 1]])]);
    expect(conInactivo.map((t) => t.codigo)).toEqual(["ORD", "HED", "HEDN"]);
    const desconocido = tiposDeGrilla(catalogo, [registro(1, "2026-10-05", [[99, "HEDD", 1]])]);
    expect(desconocido.at(-1)).toMatchObject({ id: 99, esExtra: true, activo: false });
  });
});
