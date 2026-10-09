// Nómina: liquidaciones, desprendibles y exportaciones.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, parametros } from "@/lib/api";
import { descargarArchivo } from "@/lib/descargas";
import type { Desprendible, LiquidacionDetalle, LiquidacionResumen, TipoPeriodo } from "@/types/api";

export const claveNomina = ["nomina"] as const;

export function useLiquidaciones(anio?: number) {
  return useQuery({
    queryKey: [...claveNomina, "liquidaciones", anio ?? "todas"],
    queryFn: async () =>
      (await api.get<LiquidacionResumen[]>("/nomina/liquidaciones", { params: parametros({ anio }) })).data,
  });
}

export function useLiquidacion(id: number | undefined) {
  return useQuery({
    queryKey: [...claveNomina, "liquidacion", id],
    queryFn: async () => (await api.get<LiquidacionDetalle>(`/nomina/liquidaciones/${id}`)).data,
    enabled: Boolean(id),
  });
}

export function useDesprendible(id: number | undefined) {
  return useQuery({
    queryKey: [...claveNomina, "desprendible", id],
    queryFn: async () => (await api.get<Desprendible>(`/nomina/desprendibles/${id}`)).data,
    enabled: Boolean(id),
  });
}

export function useCrearLiquidacion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (datos: { tipoPeriodo: TipoPeriodo; anio: number; mes: number; quincena?: 1 | 2 }) =>
      (await api.post<LiquidacionDetalle>("/nomina/liquidaciones", datos)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: claveNomina });
      qc.invalidateQueries({ queryKey: ["reportes"] });
    },
  });
}

type AccionLiquidacion = "recalcular" | "cerrar" | "reabrir";

export function useAccionLiquidacion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, accion }: { id: number; accion: AccionLiquidacion }) =>
      (await api.post<LiquidacionDetalle>(`/nomina/liquidaciones/${id}/${accion}`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: claveNomina });
      qc.invalidateQueries({ queryKey: ["reportes"] });
    },
  });
}

export function useEliminarLiquidacion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/nomina/liquidaciones/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: claveNomina });
      qc.invalidateQueries({ queryKey: ["reportes"] });
    },
  });
}

export const descargarConsolidadoExcel = (id: number) =>
  descargarArchivo(`/nomina/liquidaciones/${id}/excel`, `nomina-${id}.xlsx`);

export const descargarConsolidadoPdf = (id: number) =>
  descargarArchivo(`/nomina/liquidaciones/${id}/pdf`, `nomina-${id}.pdf`);

export const descargarDesprendiblePdf = (id: number) =>
  descargarArchivo(`/nomina/desprendibles/${id}/pdf`, `desprendible-${id}.pdf`);
