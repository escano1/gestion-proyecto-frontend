"use client";

import Link from "next/link";
import { AlertTriangle, Clock, FolderKanban, Package, Users, Wallet, Wrench } from "lucide-react";
import { useDashboard } from "@/features/reportes/api";
import { GraficoCostoPorProyecto, GraficoHorasPorTipo } from "@/features/dashboard/graficos";
import { AvanceProyectos } from "@/features/dashboard/avance-proyectos";
import { UltimaLiquidacion } from "@/features/dashboard/ultima-liquidacion";
import { mensajeError } from "@/lib/errores";
import { formatoFecha, formatoHoras, formatoNumero, formatoPesos } from "@/lib/formato";
import { cn } from "@/lib/cn";
import { Card, CardHeader, EmptyState, ErrorState, PageHeader, Spinner, StatCard } from "@/components/ui/display";

const ICONO = "size-5";

export default function PaginaDashboard() {
  const consulta = useDashboard();

  if (consulta.isPending) return <Spinner />;
  if (consulta.isError) {
    return <ErrorState mensaje={mensajeError(consulta.error)} reintentar={() => consulta.refetch()} />;
  }

  const d = consulta.data;
  const rangoMes = `${formatoFecha(d.mes.desde)} – ${formatoFecha(d.mes.hasta)}`;
  const hayAlertas = d.alertasHorasExtra > 0;

  return (
    <>
      <PageHeader titulo="Dashboard" descripcion={`Resumen al ${formatoFecha(d.fecha)} · mes en curso ${rangoMes}`} />

      <div className="space-y-6">
        <section aria-label="Indicadores principales" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            titulo="Proyectos activos"
            valor={formatoNumero(d.proyectosActivos)}
            icono={<FolderKanban className={ICONO} aria-hidden />}
          />
          <StatCard
            titulo="Trabajadores activos"
            valor={formatoNumero(d.trabajadoresActivos)}
            icono={<Users className={ICONO} aria-hidden />}
          />
          <StatCard
            titulo="Horas del mes"
            valor={formatoHoras(d.mes.horas)}
            detalle={`${formatoHoras(d.mes.horasExtra)} extra`}
            icono={<Clock className={ICONO} aria-hidden />}
          />
          <StatCard
            titulo="Costo de mano de obra del mes"
            valor={formatoPesos(d.mes.costo)}
            detalle="Directo, sin carga prestacional"
            icono={<Wallet className={ICONO} aria-hidden />}
          />
        </section>

        <section aria-label="Indicadores operativos" className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            titulo="Alertas de horas extra"
            valor={formatoNumero(d.alertasHorasExtra)}
            tono={hayAlertas ? "alerta" : "normal"}
            icono={<AlertTriangle className={ICONO} aria-hidden />}
            detalle={
              <Link href="/reportes" className={cn("font-medium hover:underline", hayAlertas ? "text-amber-700" : "text-marca-700")}>
                {hayAlertas ? "Revisar en reportes" : "Ver reportes"}
              </Link>
            }
          />
          <StatCard
            titulo="Materiales pendientes"
            valor={formatoNumero(d.materialesPendientes)}
            detalle="Pendientes o solicitados"
            icono={<Package className={ICONO} aria-hidden />}
          />
          <StatCard
            titulo="Herramientas vencidas"
            valor={formatoNumero(d.herramientasVencidas)}
            detalle="Con devolución prevista vencida"
            tono={d.herramientasVencidas > 0 ? "alerta" : "normal"}
            icono={<Wrench className={ICONO} aria-hidden />}
          />
        </section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader titulo="Horas del mes por tipo" descripcion={rangoMes} />
            {d.mes.porTipo.length === 0 ? (
              <EmptyState titulo="Sin horas registradas este mes" />
            ) : (
              <GraficoHorasPorTipo datos={d.mes.porTipo} />
            )}
          </Card>
          <Card>
            <CardHeader titulo="Costo de mano de obra por proyecto" descripcion="Mes en curso · proyectos de mayor costo" />
            {d.costoPorProyecto.length === 0 ? (
              <EmptyState titulo="Sin costos registrados este mes" />
            ) : (
              <GraficoCostoPorProyecto datos={d.costoPorProyecto} />
            )}
          </Card>
        </div>

        <div className={cn("grid grid-cols-1 gap-6", d.ultimaLiquidacion && "lg:grid-cols-3")}>
          <div className={cn(d.ultimaLiquidacion && "lg:col-span-2")}>
            <AvanceProyectos proyectos={d.avanceProyectos} />
          </div>
          {d.ultimaLiquidacion && <UltimaLiquidacion liquidacion={d.ultimaLiquidacion} />}
        </div>
      </div>
    </>
  );
}
