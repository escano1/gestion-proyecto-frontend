import { describe, expect, it } from "vitest";
import {
  agregarSinDuplicados,
  etiquetaEnLineas,
  filtrarProyectos,
  materialVencido,
  pesosCompletos,
  porcentajeEjecucion,
  prepararArchivos,
  puedeEliminarEntrada,
  seAbreEnNavegador,
  siguienteEstadoMaterial,
  sumaPesos,
  TAMANO_MAXIMO_BYTES,
  tieneMaxDosDecimales,
  tipoAdjunto,
  validarArchivos,
} from "./utilidades";

const DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

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

describe("materiales", () => {
  it("marca vencidos solo si no se han entregado y la fecha requerida ya pasó", () => {
    const hoy = "2026-10-08";
    expect(materialVencido({ estado: "PENDIENTE", fechaRequerida: "2026-10-07" }, hoy)).toBe(true);
    expect(materialVencido({ estado: "SOLICITADO", fechaRequerida: "2026-10-01" }, hoy)).toBe(true);
    expect(materialVencido({ estado: "SOLICITADO", fechaRequerida: "2026-10-08" }, hoy)).toBe(false);
    expect(materialVencido({ estado: "ENTREGADO", fechaRequerida: "2026-10-01" }, hoy)).toBe(false);
    expect(materialVencido({ estado: "PENDIENTE", fechaRequerida: null }, hoy)).toBe(false);
  });

  it("avanza por el flujo de estados", () => {
    expect(siguienteEstadoMaterial("PENDIENTE")).toBe("SOLICITADO");
    expect(siguienteEstadoMaterial("SOLICITADO")).toBe("ENTREGADO");
    expect(siguienteEstadoMaterial("ENTREGADO")).toBe("INSTALADO");
    expect(siguienteEstadoMaterial("INSTALADO")).toBeNull();
  });
});

describe("números y avance", () => {
  it("valida máximo dos decimales sin errores de punto flotante", () => {
    expect(tieneMaxDosDecimales(10)).toBe(true);
    expect(tieneMaxDosDecimales(0.07)).toBe(true);
    expect(tieneMaxDosDecimales(12.35)).toBe(true);
    expect(tieneMaxDosDecimales(1.005)).toBe(false);
  });

  it("suma pesos y detecta si completan 100", () => {
    const suma = sumaPesos([{ peso: 33.33 }, { peso: 33.33 }, { peso: 33.34 }]);
    expect(suma).toBe(100);
    expect(pesosCompletos(suma)).toBe(true);
    expect(pesosCompletos(sumaPesos([{ peso: 40 }, { peso: 50 }]))).toBe(false);
    expect(sumaPesos([])).toBe(0);
  });

  it("calcula el porcentaje de ejecución del presupuesto", () => {
    expect(porcentajeEjecucion(2_500_000, 10_000_000)).toBe(25);
    expect(porcentajeEjecucion(12_000_000, 10_000_000)).toBe(120);
    expect(porcentajeEjecucion(1_000, null)).toBeNull();
    expect(porcentajeEjecucion(1_000, 0)).toBeNull();
  });
});

describe("adjuntos de bitácora", () => {
  const archivo = (name: string, type: string, size = 1024) => ({ name, type, size });

  it("acepta los tipos permitidos y deduce el MIME por extensión si el navegador no lo da", () => {
    expect(tipoAdjunto(archivo("foto.JPG", "image/jpeg"))).toBe("image/jpeg");
    expect(tipoAdjunto(archivo("acta.docx", ""))).toBe(DOCX);
    expect(tipoAdjunto(archivo("acta.docx", "application/octet-stream"))).toBe(DOCX);
    expect(tipoAdjunto(archivo("plano.dwg", ""))).toBeNull();
    expect(tipoAdjunto(archivo("video.mp4", "video/mp4"))).toBeNull();
    expect(tipoAdjunto(archivo("falso.pdf", "text/plain"))).toBeNull();
  });

  it("valida cantidad, tipo y tamaño", () => {
    expect(validarArchivos([archivo("a.pdf", "application/pdf")])).toEqual([]);
    expect(validarArchivos([archivo("a.exe", "application/x-msdownload")])[0]).toMatch(/tipo no permitido/);
    expect(validarArchivos([archivo("a.png", "image/png", TAMANO_MAXIMO_BYTES + 1)])[0]).toMatch(/10 MB/);
    expect(validarArchivos([archivo("a.png", "image/png", TAMANO_MAXIMO_BYTES)])).toEqual([]);
    expect(validarArchivos([archivo("vacio.png", "image/png", 0)])[0]).toMatch(/vacío/);
    const seis = Array.from({ length: 6 }, (_, i) => archivo(`f${i}.png`, "image/png"));
    expect(validarArchivos(seis)[0]).toMatch(/máximo 5 archivos/);
  });

  it("cuenta los adjuntos existentes de la entrada", () => {
    const dos = [archivo("a.png", "image/png"), archivo("b.png", "image/png")];
    expect(validarArchivos(dos, 3)).toEqual([]);
    expect(validarArchivos(dos, 4)[0]).toMatch(/ya tiene 4/);
  });

  it("corrige el MIME de archivos sin tipo y evita duplicados", () => {
    const sinTipo = new File(["PK"], "informe.xlsx", { type: "", lastModified: 1 });
    const [preparado] = prepararArchivos([sinTipo]);
    expect(preparado.type).toBe("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    expect(preparado.name).toBe("informe.xlsx");

    const foto = new File(["x"], "foto.png", { type: "image/png", lastModified: 1 });
    expect(prepararArchivos([foto])[0]).toBe(foto);
    expect(agregarSinDuplicados([foto], [foto, sinTipo])).toEqual([foto, sinTipo]);
  });

  it("abre imágenes y PDF en el navegador", () => {
    expect(seAbreEnNavegador("image/webp")).toBe(true);
    expect(seAbreEnNavegador("application/pdf")).toBe(true);
    expect(seAbreEnNavegador(DOCX)).toBe(false);
  });

  it("solo el autor o un ADMIN con rol de escritura pueden eliminar", () => {
    expect(puedeEliminarEntrada({ id: 1, rol: "ADMIN" }, 9)).toBe(true);
    expect(puedeEliminarEntrada({ id: 9, rol: "GESTOR_PROYECTOS" }, 9)).toBe(true);
    expect(puedeEliminarEntrada({ id: 2, rol: "GESTOR_PROYECTOS" }, 9)).toBe(false);
    expect(puedeEliminarEntrada({ id: 9, rol: "CONSULTA" }, 9)).toBe(false);
    expect(puedeEliminarEntrada(null, 9)).toBe(false);
  });
});
