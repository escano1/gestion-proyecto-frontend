"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { useAgregarAdjuntos } from "@/features/operacion/api";
import { mensajeError } from "@/lib/errores";
import { formatoFecha } from "@/lib/formato";
import type { EntradaBitacora } from "@/types/api";
import { SelectorArchivos } from "./selector-archivos";
import { prepararArchivos, validarArchivos } from "./utilidades";

interface Props {
  proyectoId: number;
  entrada: EntradaBitacora;
  onCerrar: () => void;
}

/** Agrega archivos a una entrada existente (cuentan los adjuntos que ya tiene). */
export function AdjuntosForm({ proyectoId, entrada, onCerrar }: Props) {
  const agregar = useAgregarAdjuntos(proyectoId);
  const [archivos, setArchivos] = useState<File[]>([]);
  const existentes = entrada.adjuntos.length;
  const validos = archivos.length > 0 && validarArchivos(archivos, existentes).length === 0;

  const enviar = () => {
    if (!validos) return;
    agregar.mutate(
      { entradaId: entrada.id, archivos: prepararArchivos(archivos) },
      {
        onSuccess: () => {
          toast.success(archivos.length === 1 ? "Adjunto agregado" : `${archivos.length} adjuntos agregados`);
          onCerrar();
        },
        onError: (e) => toast.error(mensajeError(e)),
      },
    );
  };

  return (
    <Modal
      abierto
      onCerrar={onCerrar}
      titulo="Agregar adjuntos"
      descripcion={`Entrada del ${formatoFecha(entrada.fecha)} · ${existentes} adjunto${existentes === 1 ? "" : "s"} actual${existentes === 1 ? "" : "es"}`}
      ancho="sm"
      pie={
        <>
          <Button variante="secundario" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button onClick={enviar} cargando={agregar.isPending} disabled={!validos}>
            Adjuntar
          </Button>
        </>
      }
    >
      <SelectorArchivos archivos={archivos} onCambiar={setArchivos} existentes={existentes} />
    </Modal>
  );
}
