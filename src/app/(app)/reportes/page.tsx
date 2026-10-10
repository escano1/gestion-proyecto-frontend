"use client";

import { useState } from "react";
import type { RangoFechas } from "@/features/reportes/api";
import { ReporteHorasTab } from "@/features/reportes-ui/tab-horas";
import { CostosProyectosTab } from "@/features/reportes-ui/tab-costos";
import { AlertasTab } from "@/features/reportes-ui/tab-alertas";
import { NominaPeriodosTab } from "@/features/reportes-ui/tab-nomina";
import { useSesion } from "@/lib/auth-store";
import { puedeVerNomina } from "@/lib/permisos";
import { hoy, primerDiaMes, ultimoDiaMes } from "@/lib/fechas";
import { PageHeader } from "@/components/ui/display";
import { Tabs } from "@/components/ui/tabs";

type Pestana = "horas" | "costos" | "alertas" | "nomina";

const PESTANAS: { id: Pestana; etiqueta: string }[] = [
  { id: "horas", etiqueta: "Horas" },
  { id: "costos", etiqueta: "Costos por proyecto" },
  { id: "alertas", etiqueta: "Alertas de horas extra" },
  { id: "nomina", etiqueta: "Nómina por periodo" },
];

function mesEnCurso(): RangoFechas {
  const fecha = hoy();
  return { desde: primerDiaMes(fecha), hasta: ultimoDiaMes(fecha) };
}

export default function PaginaReportes() {
  const rol = useSesion((s) => s.usuario?.rol);
  const verNomina = puedeVerNomina(rol);
  const [activa, setActiva] = useState<Pestana>("horas");
  // El rango se comparte entre horas, costos y alertas para comparar el mismo periodo.
  const [rango, setRango] = useState<RangoFechas>(mesEnCurso);

  const pestanas = PESTANAS.filter((p) => p.id !== "nomina" || verNomina);
  const etiquetaActiva = pestanas.find((p) => p.id === activa)?.etiqueta;

  return (
    <>
      <PageHeader titulo="Reportes" descripcion="Horas, costos, alertas y nómina" />
      <Tabs pestanas={pestanas} activa={activa} onCambiar={setActiva} />
      <div role="tabpanel" aria-label={etiquetaActiva}>
        {activa === "horas" && <ReporteHorasTab rango={rango} onCambiarRango={setRango} />}
        {activa === "costos" && <CostosProyectosTab rango={rango} onCambiarRango={setRango} />}
        {activa === "alertas" && <AlertasTab rango={rango} onCambiarRango={setRango} />}
        {activa === "nomina" && verNomina && <NominaPeriodosTab habilitado={verNomina} />}
      </div>
    </>
  );
}
