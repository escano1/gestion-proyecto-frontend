"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ChevronDown, FileText } from "lucide-react";
import { descargarDesprendiblePdf, useDesprendible } from "@/features/nomina/api";
import { agruparParametros, periodoDesdeFechas, rangoFechas } from "@/features/liquidacion/formato-nomina";
import { SinPermisoNomina } from "@/features/liquidacion/sin-permiso";
import { TablaConceptos } from "@/features/liquidacion/tabla-conceptos";
import { useDescarga } from "@/features/liquidacion/use-descarga";
import { useSesion } from "@/lib/auth-store";
import { puedeVerNomina } from "@/lib/permisos";
import { mensajeError } from "@/lib/errores";
import { TIPOS_DOCUMENTO, TIPOS_PERIODO, TIPOS_SALARIO } from "@/lib/etiquetas";
import { formatoNumero, formatoPesos } from "@/lib/formato";
import { Button } from "@/components/ui/button";
import { Alertas, Card, CardHeader, DataList, ErrorState, PageHeader, Spinner } from "@/components/ui/display";
import { EstadoBadge } from "@/components/ui/estado-badge";

export default function PaginaDesprendible() {
  const rol = useSesion((s) => s.usuario?.rol);
  if (!puedeVerNomina(rol)) return <SinPermisoNomina />;
  return <ComprobantePago />;
}

function ComprobantePago() {
  const { id } = useParams<{ id: string }>();
  const nominaId = Number(id);
  const idValido = Number.isInteger(nominaId) && nominaId > 0;
  const consulta = useDesprendible(idValido ? nominaId : undefined);
  const { enCurso, descargar } = useDescarga<"pdf">();

  if (!idValido) return <ErrorState mensaje="Comprobante no encontrado" />;
  if (consulta.isPending) return <Spinner />;
  if (consulta.isError) return <ErrorState mensaje={mensajeError(consulta.error)} reintentar={() => consulta.refetch()} />;

  const d = consulta.data;
  const periodo = periodoDesdeFechas(d.liquidacion.tipoPeriodo, d.liquidacion.fechaInicio);
  const devengados = d.conceptos.filter((c) => c.tipo === "DEVENGADO");
  const deducciones = d.conceptos.filter((c) => c.tipo === "DEDUCCION");
  const gruposParametros = agruparParametros(d.parametros);

  return (
    <>
      <Link
        href={`/nomina/${d.liquidacion.id}`}
        className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="size-4" /> Liquidación {periodo}
      </Link>
      <PageHeader
        titulo="Comprobante de pago"
        descripcion={`${d.nombreTrabajador} · ${periodo}`}
        acciones={
          <Button
            variante="secundario"
            onClick={() => descargar("pdf", () => descargarDesprendiblePdf(d.id))}
            cargando={enCurso === "pdf"}
          >
            {enCurso !== "pdf" && <FileText className="size-4" />} Descargar PDF
          </Button>
        }
      />

      <div className="space-y-6">
        <Card>
          <CardHeader
            titulo="Trabajador y periodo"
            acciones={<EstadoBadge dominio="liquidacion" estado={d.liquidacion.estado} />}
          />
          <div className="p-4">
            <DataList
              items={[
                { etiqueta: "Trabajador", valor: d.nombreTrabajador },
                {
                  etiqueta: "Documento",
                  valor: <span title={TIPOS_DOCUMENTO[d.tipoDocumento]}>{`${d.tipoDocumento} ${d.numeroDocumento}`}</span>,
                },
                { etiqueta: "Cargo", valor: d.cargo },
                {
                  etiqueta: d.tipoSalario === "POR_HORA" ? "Salario (por hora)" : "Salario mensual",
                  valor: formatoPesos(d.salarioBase),
                },
                { etiqueta: "Valor hora ordinaria", valor: formatoPesos(d.valorHora) },
                { etiqueta: "Tipo de salario", valor: TIPOS_SALARIO[d.tipoSalario] },
                { etiqueta: "Periodo", valor: `${TIPOS_PERIODO[d.liquidacion.tipoPeriodo]} · ${periodo}` },
                { etiqueta: "Fechas", valor: rangoFechas(d.liquidacion.fechaInicio, d.liquidacion.fechaFin) },
                { etiqueta: "Días laborados", valor: formatoNumero(d.diasLaborados) },
                { etiqueta: "IBC (ingreso base de cotización)", valor: formatoPesos(d.ibc) },
              ]}
            />
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <TablaConceptos
            titulo="Devengados"
            conceptos={devengados}
            etiquetaTotal="Total devengado"
            total={d.totalDevengado}
          />
          <TablaConceptos
            titulo="Deducciones"
            conceptos={deducciones}
            etiquetaTotal="Total deducciones"
            total={d.totalDeducciones}
          />
        </div>

        <Card className="flex flex-wrap items-center justify-between gap-4 bg-marca-700 p-5 text-white ring-marca-800">
          <dl className="space-y-1 text-sm text-marca-100">
            <div className="flex gap-2">
              <dt>Total devengado:</dt>
              <dd className="font-medium text-white tabular-nums">{formatoPesos(d.totalDevengado)}</dd>
            </div>
            <div className="flex gap-2">
              <dt>Total deducciones:</dt>
              <dd className="font-medium text-white tabular-nums">− {formatoPesos(d.totalDeducciones)}</dd>
            </div>
          </dl>
          <div className="text-right">
            <p className="text-sm text-marca-100">Neto a pagar</p>
            <p className="text-3xl font-semibold tracking-tight tabular-nums">{formatoPesos(d.netoPagar)}</p>
          </div>
        </Card>

        <Alertas titulo="Alertas del cálculo" mensajes={d.alertas} />

        <details className="group rounded-lg bg-white shadow-xs ring-1 ring-slate-200">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
            <span>
              <span className="block text-sm font-semibold text-slate-900">Parámetros legales aplicados</span>
              <span className="block text-xs text-slate-500">Valores vigentes al inicio del periodo usados en el cálculo</span>
            </span>
            <ChevronDown className="size-4 text-slate-500 transition-transform group-open:rotate-180" aria-hidden />
          </summary>
          <div className="grid grid-cols-1 gap-6 border-t border-slate-200 p-4 sm:grid-cols-2 lg:grid-cols-4">
            {gruposParametros.map((g) => (
              <section key={g.grupo}>
                <h3 className="text-xs font-semibold tracking-wide text-slate-500 uppercase">{g.grupo}</h3>
                <dl className="mt-2 space-y-1.5">
                  {g.items.map((p) => (
                    <div key={p.clave} className="flex justify-between gap-3 text-sm">
                      <dt className="text-slate-600">{p.etiqueta}</dt>
                      <dd className="font-medium whitespace-nowrap text-slate-900 tabular-nums">{p.valor}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            ))}
          </div>
        </details>
      </div>
    </>
  );
}
