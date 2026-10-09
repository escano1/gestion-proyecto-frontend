// Registro de horas.
import { keepPreviousData, useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { api, parametros } from "@/lib/api";
import type {
  EntradaRegistroHoras,
  Pagina,
  RegistroHoras,
  RespuestaLoteHoras,
  RespuestaRegistroHoras,
} from "@/types/api";

export const claveHoras = ["registro-horas"] as const;

export interface FiltroHoras {
  desde?: string;
  hasta?: string;
  trabajadorId?: number;
  proyectoId?: number;
  pagina?: number;
  limite?: number;
}

export function useRegistrosHoras(filtro: FiltroHoras, habilitado = true) {
  return useQuery({
    queryKey: [...claveHoras, "lista", filtro],
    queryFn: async () =>
      (await api.get<Pagina<RegistroHoras>>("/registro-horas", { params: parametros(filtro) })).data,
    placeholderData: keepPreviousData,
    enabled: habilitado,
  });
}

export function useRegistroHoras(id: number | undefined) {
  return useQuery({
    queryKey: [...claveHoras, id],
    queryFn: async () => (await api.get<RegistroHoras>(`/registro-horas/${id}`)).data,
    enabled: Boolean(id),
  });
}

// Las horas alimentan reportes, costos y nómina (requiereRecalculo).
function invalidarDependientes(qc: QueryClient) {
  qc.invalidateQueries({ queryKey: claveHoras });
  qc.invalidateQueries({ queryKey: ["reportes"] });
  qc.invalidateQueries({ queryKey: ["nomina"] });
}

export function useCrearRegistroHoras() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (datos: EntradaRegistroHoras) =>
      (await api.post<RespuestaRegistroHoras>("/registro-horas", datos)).data,
    onSuccess: () => invalidarDependientes(qc),
  });
}

export function useActualizarRegistroHoras() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      datos,
    }: {
      id: number;
      datos: { observacion?: string | null; detalles?: { tipoHoraId: number; horas: number }[] };
    }) => (await api.patch<RespuestaRegistroHoras>(`/registro-horas/${id}`, datos)).data,
    onSuccess: () => invalidarDependientes(qc),
  });
}

export function useEliminarRegistroHoras() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/registro-horas/${id}`);
    },
    onSuccess: () => invalidarDependientes(qc),
  });
}

/** Upsert por lotes (captura semanal). Ítems con todas las horas en 0 eliminan el registro existente. */
export function useGuardarLoteHoras() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (registros: EntradaRegistroHoras[]) =>
      (await api.put<RespuestaLoteHoras>("/registro-horas/lote", { registros })).data,
    onSuccess: () => invalidarDependientes(qc),
  });
}
