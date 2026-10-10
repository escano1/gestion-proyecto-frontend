"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useProyecto } from "@/features/personal/api";
import { EncabezadoProyecto } from "@/features/proyectos/encabezado-proyecto";
import { ProyectoForm } from "@/features/proyectos/proyecto-form";
import { PestanaEquipo } from "@/features/proyectos/pestana-equipo";
import { PestanaGastos } from "@/features/proyectos/pestana-gastos";
import { PestanaMateriales } from "@/features/proyectos/pestana-materiales";
import { PestanaResumen } from "@/features/proyectos/pestana-resumen";
import { useSesion } from "@/lib/auth-store";
import { puedeEscribir } from "@/lib/permisos";
import { mensajeError } from "@/lib/errores";
import { Card, ErrorState, Spinner } from "@/components/ui/display";
import { Tabs } from "@/components/ui/tabs";

const PESTANAS = [
  { id: "resumen", etiqueta: "Resumen" },
  { id: "equipo", etiqueta: "Equipo" },
  { id: "materiales", etiqueta: "Materiales" },
  { id: "gastos", etiqueta: "Gastos" },
] as const;

type Pestana = (typeof PESTANAS)[number]["id"];

const VolverAProyectos = () => (
  <Link href="/proyectos" className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
    <ArrowLeft className="size-4" /> Proyectos
  </Link>
);

export default function PaginaProyecto() {
  const { id } = useParams<{ id: string }>();
  const proyectoId = Number(id);
  const idValido = Number.isInteger(proyectoId) && proyectoId > 0;
  const rol = useSesion((s) => s.usuario?.rol);
  const proyecto = useProyecto(idValido ? proyectoId : undefined);
  const [pestana, setPestana] = useState<Pestana>("resumen");
  const [editando, setEditando] = useState(false);

  if (!idValido) {
    return (
      <>
        <VolverAProyectos />
        <Card>
          <ErrorState mensaje="El proyecto solicitado no existe." />
        </Card>
      </>
    );
  }
  if (proyecto.isPending) return <Spinner />;
  if (proyecto.isError) {
    return (
      <>
        <VolverAProyectos />
        <Card>
          <ErrorState mensaje={mensajeError(proyecto.error)} reintentar={() => proyecto.refetch()} />
        </Card>
      </>
    );
  }

  const p = proyecto.data;
  const etiquetaActiva = PESTANAS.find((t) => t.id === pestana)?.etiqueta;

  return (
    <>
      <VolverAProyectos />
      <EncabezadoProyecto
        proyecto={p}
        onEditar={puedeEscribir(rol, "proyectos") ? () => setEditando(true) : undefined}
      />

      <Tabs pestanas={[...PESTANAS]} activa={pestana} onCambiar={setPestana} />
      <section role="tabpanel" aria-label={etiquetaActiva}>
        {pestana === "resumen" && <PestanaResumen proyectoId={p.id} />}
        {pestana === "equipo" && <PestanaEquipo proyectoId={p.id} />}
        {pestana === "materiales" && <PestanaMateriales proyectoId={p.id} />}
        {pestana === "gastos" && <PestanaGastos proyectoId={p.id} />}
      </section>

      {editando && <ProyectoForm proyecto={p} onCerrar={() => setEditando(false)} />}
    </>
  );
}
