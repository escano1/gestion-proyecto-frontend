"use client";

import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { History, Lock, Save, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { useAsignaciones, useProyectos } from "@/features/personal/api";
import { useGuardarLoteHoras, useRegistrosHoras } from "@/features/horas/api";
import { useParametrosVigentes, useTiposHora } from "@/features/catalogos/api";
import {
  armarLote,
  celdasDesdeRegistros,
  celdasInvalidas,
  CODIGOS_VISIBLES_POR_DEFECTO,
  combinarCeldas,
  descartarGuardadas,
  paresModificados,
  resumenLote,
  tiposDeGrilla,
  trabajadoresGrilla,
  type Celdas,
} from "@/features/registro-horas/grilla";
import { GrillaSemanal, SelectorTipos } from "@/features/registro-horas/grilla-semanal";
import { SelectorSemana } from "@/features/registro-horas/selector-semana";
import { EnlaceBoton } from "@/features/registro-horas/enlace-boton";
import { useSesion } from "@/lib/auth-store";
import { puedeEscribir } from "@/lib/permisos";
import { mensajeError } from "@/lib/errores";
import { diasSemana, hoy, inicioSemana, sumarDias } from "@/lib/fechas";
import { Button } from "@/components/ui/button";
import { Alertas, Card, EmptyState, ErrorState, PageHeader, Spinner } from "@/components/ui/display";
import { Field, Select } from "@/components/ui/form-controls";
import { ConfirmDialog } from "@/components/ui/modal";

/** Máximo de registros por página del API; la semana se carga en hasta 2 páginas. */
const LIMITE = 200;
const CLAVE_ULTIMO_PROYECTO = "gp-registro-horas-proyecto";

function leerUltimoProyecto(): number | undefined {
  try {
    const valor = Number(localStorage.getItem(CLAVE_ULTIMO_PROYECTO));
    return valor > 0 ? valor : undefined;
  } catch {
    return undefined;
  }
}

function recordarProyecto(proyectoId: number | undefined) {
  try {
    if (proyectoId) localStorage.setItem(CLAVE_ULTIMO_PROYECTO, String(proyectoId));
  } catch {
    // Preferencia opcional: si el almacenamiento no está disponible no pasa nada.
  }
}

interface Destino {
  proyectoId: number | undefined;
  lunes: string;
}

export default function PaginaRegistroHoras() {
  const rol = useSesion((s) => s.usuario?.rol);
  const fechaHoy = hoy();
  const [proyectoElegido, setProyectoElegido] = useState<number | undefined>(leerUltimoProyecto);
  const [lunes, setLunes] = useState(() => inicioSemana(hoy()));
  const [ediciones, setEdiciones] = useState<Celdas>({});
  const [entradasInvalidas, setEntradasInvalidas] = useState<ReadonlySet<string>>(() => new Set());
  const [visibles, setVisibles] = useState<ReadonlySet<string>>(() => new Set(CODIGOS_VISIBLES_POR_DEFECTO));
  const [alertas, setAlertas] = useState<string[]>([]);
  const [pendiente, setPendiente] = useState<Destino | null>(null);

  const proyectos = useProyectos({ estado: "ACTIVO" });
  const proyectoId = proyectos.data?.some((p) => p.id === proyectoElegido) ? proyectoElegido : undefined;
  const hayProyecto = proyectoId !== undefined;
  const dias = diasSemana(lunes);
  const filtro = { proyectoId, desde: lunes, hasta: sumarDias(lunes, 6) };

  const asignaciones = useAsignaciones(filtro, hayProyecto);
  const pagina1 = useRegistrosHoras({ ...filtro, limite: LIMITE }, hayProyecto);
  const hayMas = !pagina1.isPlaceholderData && (pagina1.data?.total ?? 0) > LIMITE;
  const pagina2 = useRegistrosHoras({ ...filtro, pagina: 2, limite: LIMITE }, hayProyecto && hayMas);
  const tiposHora = useTiposHora();
  const parametros = useParametrosVigentes(lunes);
  const guardarLote = useGuardarLoteHoras();

  const datosPagina1 = pagina1.data?.datos;
  const datosPagina2 = hayMas ? pagina2.data?.datos : undefined;
  const registros = useMemo(() => [...(datosPagina1 ?? []), ...(datosPagina2 ?? [])], [datosPagina1, datosPagina2]);
  const base = useMemo(() => celdasDesdeRegistros(registros), [registros]);
  const actual = useMemo(() => combinarCeldas(base, ediciones), [base, ediciones]);
  const pares = useMemo(() => paresModificados(base, actual), [base, actual]);
  const invalidas = useMemo(
    () => new Set([...celdasInvalidas(actual), ...entradasInvalidas]),
    [actual, entradasInvalidas],
  );
  const tipos = useMemo(() => tiposDeGrilla(tiposHora.data ?? [], registros), [tiposHora.data, registros]);
  const trabajadores = useMemo(
    () => trabajadoresGrilla(asignaciones.data ?? [], registros),
    [asignaciones.data, registros],
  );

  const cargando =
    asignaciones.isPending ||
    tiposHora.isPending ||
    pagina1.isPending ||
    pagina1.isPlaceholderData ||
    (hayMas && (pagina2.isPending || pagina2.isPlaceholderData));
  const errorCarga = asignaciones.error ?? pagina1.error ?? tiposHora.error ?? (hayMas ? pagina2.error : null);
  const totalRegistros = pagina1.data?.total ?? 0;
  const incompleto = !cargando && totalRegistros > registros.length;
  const conPermiso = puedeEscribir(rol, "horas");
  const editable = conPermiso && !incompleto;
  const hayCambios = pares.length > 0 || entradasInvalidas.size > 0;
  const limiteExtraDia = parametros.data?.valores.limiteHorasExtraDia ?? 2;
  const limiteExtraSemana = parametros.data?.valores.limiteHorasExtraSemana ?? 12;

  // Evita perder lo digitado al cerrar o recargar la pestaña.
  useEffect(() => {
    if (!hayCambios) return;
    const avisar = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", avisar);
    return () => window.removeEventListener("beforeunload", avisar);
  }, [hayCambios]);

  const aplicar = (destino: Destino) => {
    setProyectoElegido(destino.proyectoId);
    setLunes(destino.lunes);
    setEdiciones({});
    setEntradasInvalidas(new Set());
    setAlertas([]);
    setPendiente(null);
    recordarProyecto(destino.proyectoId);
  };

  const solicitar = (destino: Destino) => (hayCambios ? setPendiente(destino) : aplicar(destino));

  const cambiarCelda = (clave: string, texto: string, entradaInvalida: boolean) => {
    setEdiciones((previas) => ({ ...previas, [clave]: texto }));
    setEntradasInvalidas((previas) => {
      if (previas.has(clave) === entradaInvalida) return previas;
      const siguientes = new Set(previas);
      if (entradaInvalida) siguientes.add(clave);
      else siguientes.delete(clave);
      return siguientes;
    });
  };

  const cambiarVisibilidad = (codigo: string, visible: boolean) =>
    setVisibles((previos) => {
      const siguientes = new Set(previos);
      if (visible) siguientes.add(codigo);
      else siguientes.delete(codigo);
      return siguientes;
    });

  const guardar = async () => {
    if (!editable || proyectoId === undefined || guardarLote.isPending || !hayCambios) return;
    if (invalidas.size > 0) {
      toast.error("Hay celdas con valores inválidos (de 0 a 24 h, máximo 2 decimales). Corríjalas antes de guardar.");
      return;
    }
    const enviadas = ediciones;
    try {
      const respuesta = await guardarLote.mutateAsync(armarLote(base, actual, proyectoId));
      setAlertas(respuesta.alertas);
      toast.success(resumenLote(respuesta));
      await Promise.all([pagina1.refetch(), hayMas ? pagina2.refetch() : null]);
      setEdiciones((previas) => descartarGuardadas(previas, enviadas));
    } catch (error) {
      toast.error(mensajeError(error));
    }
  };

  const atajos = (e: KeyboardEvent<HTMLDivElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
      e.preventDefault();
      void guardar();
    }
  };

  let contenido;
  if (proyectos.isPending) contenido = <Spinner />;
  else if (proyectos.isError)
    contenido = <ErrorState mensaje={mensajeError(proyectos.error)} reintentar={() => proyectos.refetch()} />;
  else if (proyectos.data.length === 0)
    contenido = <EmptyState titulo="No hay proyectos activos" descripcion="Las horas se registran sobre proyectos activos." />;
  else if (!hayProyecto)
    contenido = (
      <EmptyState titulo="Seleccione un proyecto" descripcion="Elija el proyecto y la semana para capturar las horas." />
    );
  else if (errorCarga)
    contenido = (
      <ErrorState
        mensaje={mensajeError(errorCarga)}
        reintentar={() => {
          asignaciones.refetch();
          pagina1.refetch();
          tiposHora.refetch();
        }}
      />
    );
  else if (cargando) contenido = <Spinner texto="Cargando la semana…" />;
  else if (trabajadores.length === 0)
    contenido = (
      <EmptyState
        titulo="Sin trabajadores asignados en esta semana"
        descripcion="Asigne trabajadores al proyecto para poder registrar sus horas."
        accion={
          puedeEscribir(rol, "asignaciones") && (
            <Link href={`/proyectos/${proyectoId}`} className="text-sm font-medium text-marca-700 hover:underline">
              Gestionar asignaciones del proyecto
            </Link>
          )
        }
      />
    );
  else
    contenido = (
      <>
        <div className="border-b border-slate-200 p-3">
          <SelectorTipos tipos={tipos} visibles={visibles} onCambiar={cambiarVisibilidad} />
        </div>
        <GrillaSemanal
          dias={dias}
          hoy={fechaHoy}
          trabajadores={trabajadores}
          tipos={tipos}
          codigosVisibles={visibles}
          base={base}
          actual={actual}
          invalidas={invalidas}
          editable={editable}
          limiteExtraDia={limiteExtraDia}
          limiteExtraSemana={limiteExtraSemana}
          onCambiar={cambiarCelda}
        />
        <p className="border-t border-slate-200 px-3 py-2 text-xs text-slate-500">
          Gris: día fuera de la asignación o futuro · Azul: cambio sin guardar · Ámbar: más de{" "}
          {limiteExtraDia} h extra en el día (horas de este proyecto). Enter baja a la siguiente fila, ↑/↓ ajustan
          0,5 h y Ctrl+S guarda.
        </p>
        {editable && (
          <div className="sticky bottom-0 z-20 flex flex-wrap items-center justify-end gap-3 rounded-b-lg border-t border-slate-200 bg-white/95 px-3 py-2.5 backdrop-blur">
            <span className="mr-auto text-sm text-slate-600" aria-live="polite">
              {invalidas.size > 0 ? (
                <span className="text-red-600">
                  {invalidas.size} celda{invalidas.size === 1 ? "" : "s"} con valor inválido
                </span>
              ) : pares.length > 0 ? (
                `${pares.length} día${pares.length === 1 ? "" : "s"} con cambios sin guardar`
              ) : (
                "Sin cambios pendientes"
              )}
            </span>
            <Button
              variante="secundario"
              onClick={() => setPendiente({ proyectoId, lunes })}
              disabled={!hayCambios || guardarLote.isPending}
            >
              <Undo2 className="size-4" /> Descartar
            </Button>
            <Button onClick={() => void guardar()} disabled={!hayCambios} cargando={guardarLote.isPending}>
              <Save className="size-4" /> Guardar cambios
            </Button>
          </div>
        )}
      </>
    );

  return (
    <>
      <PageHeader
        titulo="Registro de horas"
        descripcion="Captura semanal por proyecto"
        acciones={
          <EnlaceBoton href="/registro-horas/historial">
            <History className="size-4" /> Historial
          </EnlaceBoton>
        }
      />

      <div className="space-y-4" onKeyDown={atajos}>
        <Card className="flex flex-wrap items-end gap-4 p-4">
          <Field label="Proyecto" className="w-full min-w-60 sm:w-auto sm:flex-1">
            {(id) => (
              <Select
                id={id}
                value={proyectoId ?? ""}
                onChange={(e) => solicitar({ proyectoId: Number(e.target.value) || undefined, lunes })}
                disabled={proyectos.isPending}
              >
                <option value="">Seleccione un proyecto</option>
                {proyectos.data?.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.codigo} · {p.nombre}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <SelectorSemana lunes={lunes} hoy={fechaHoy} onCambiar={(l) => solicitar({ proyectoId, lunes: l })} />
        </Card>

        {!conPermiso && (
          <p className="flex items-center gap-2 rounded-md bg-slate-100 px-3 py-2 text-sm text-slate-600">
            <Lock className="size-4" aria-hidden /> Solo lectura: su rol no permite registrar horas.
          </p>
        )}
        {incompleto && (
          <Alertas
            titulo="Grilla en solo lectura"
            mensajes={[
              `La semana tiene ${totalRegistros} registros y la grilla solo carga ${registros.length}. Use el historial para consultarlos o editarlos.`,
            ]}
          />
        )}
        <Alertas titulo="Alertas de horas (no bloquean el guardado)" mensajes={alertas} />

        <Card>{contenido}</Card>
      </div>

      <ConfirmDialog
        abierto={pendiente !== null}
        titulo="Cambios sin guardar"
        mensaje={
          <>
            Hay {pares.length > 0 ? `${pares.length} día${pares.length === 1 ? "" : "s"}` : "celdas"} con cambios sin
            guardar. Si continúa, lo digitado se descartará.
          </>
        }
        textoConfirmar="Descartar cambios"
        peligroso
        onConfirmar={() => pendiente && aplicar(pendiente)}
        onCancelar={() => setPendiente(null)}
      />
    </>
  );
}
