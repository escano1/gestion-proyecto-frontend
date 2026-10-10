// Operación de proyectos: materiales (nombre, cantidad, unidad y precio).
import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Material } from "@/types/api";

const claveOperacion = (proyectoId: number | undefined, recurso: string) => ["operacion", proyectoId, recurso];

function invalidar(qc: QueryClient, proyectoId: number | undefined, recurso: string) {
  qc.invalidateQueries({ queryKey: claveOperacion(proyectoId, recurso) });
  qc.invalidateQueries({ queryKey: ["reportes"] });
}

// --- Materiales ---
export interface DatosMaterial {
  nombre?: string;
  unidadMedida?: string;
  cantidadSolicitada?: number;
  precioUnitario?: number;
}

export function useMateriales(proyectoId: number | undefined) {
  return useQuery({
    queryKey: claveOperacion(proyectoId, "materiales"),
    queryFn: async () => (await api.get<Material[]>(`/proyectos/${proyectoId}/materiales`)).data,
    enabled: Boolean(proyectoId),
  });
}

export function useGuardarMaterial(proyectoId: number | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, datos }: { id?: number; datos: DatosMaterial }) =>
      id
        ? (await api.patch<Material>(`/materiales/${id}`, datos)).data
        : (await api.post<Material>(`/proyectos/${proyectoId}/materiales`, datos)).data,
    onSuccess: () => invalidar(qc, proyectoId, "materiales"),
  });
}

export function useEliminarMaterial(proyectoId: number | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/materiales/${id}`);
    },
    onSuccess: () => invalidar(qc, proyectoId, "materiales"),
  });
}

