// Reportes y dashboard (solo lectura).
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { api, parametros } from "@/lib/api";
import type {
  AgrupacionHoras,
  AlertaHoras,
  AvanceProyectoReporte,
  Dashboard,
  EstadoProyecto,
  ReporteCostosProyectos,
  ReporteHoras,
  ReporteNominaPeriodos,
  ReportePendientes,
  ResumenProyecto,
} from "@/types/api";

const clave = (...partes: unknown[]) => ["reportes", ...partes];

export interface RangoFechas {
  desde: string;
  hasta: string;
}

export function useDashboard() {
  return useQuery({
    queryKey: clave("dashboard"),
    queryFn: async () => (await api.get<Dashboard>("/reportes/dashboard")).data,
  });
}

export function useReporteHoras(
  filtro: RangoFechas & { trabajadorId?: number; proyectoId?: number; agrupacion: AgrupacionHoras },
) {
  return useQuery({
    queryKey: clave("horas", filtro),
    queryFn: async () => (await api.get<ReporteHoras>("/reportes/horas", { params: parametros(filtro) })).data,
    placeholderData: keepPreviousData,
  });
}

export function useReporteCostosProyectos(rango: RangoFechas) {
  return useQuery({
    queryKey: clave("costos-proyectos", rango),
    queryFn: async () =>
      (await api.get<ReporteCostosProyectos>("/reportes/costos-proyectos", { params: rango })).data,
    placeholderData: keepPreviousData,
  });
}

export function useAlertasHorasExtra(rango: RangoFechas) {
  return useQuery({
    queryKey: clave("alertas", rango),
    queryFn: async () =>
      (await api.get<{ alertas: AlertaHoras[] }>("/reportes/alertas-horas-extra", { params: rango })).data,
    placeholderData: keepPreviousData,
  });
}

export function useReporteNominaPeriodos(anio: number, habilitado = true) {
  return useQuery({
    queryKey: clave("nomina-periodos", anio),
    queryFn: async () =>
      (await api.get<ReporteNominaPeriodos>("/reportes/nomina-periodos", { params: { anio } })).data,
    enabled: habilitado,
  });
}

export function usePendientes() {
  return useQuery({
    queryKey: clave("pendientes"),
    queryFn: async () => (await api.get<ReportePendientes>("/reportes/pendientes")).data,
  });
}

export function useAvanceProyectos(estado: EstadoProyecto = "ACTIVO") {
  return useQuery({
    queryKey: clave("avance-proyectos", estado),
    queryFn: async () =>
      (await api.get<AvanceProyectoReporte[]>("/reportes/avance-proyectos", { params: { estado } })).data,
  });
}

export function useResumenProyecto(proyectoId: number | undefined, rango?: Partial<RangoFechas>) {
  return useQuery({
    queryKey: clave("proyecto", proyectoId, rango ?? {}),
    queryFn: async () =>
      (await api.get<ResumenProyecto>(`/reportes/proyectos/${proyectoId}/resumen`, { params: parametros(rango) }))
        .data,
    enabled: Boolean(proyectoId),
  });
}
