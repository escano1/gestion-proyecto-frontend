import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge, Card, CardHeader } from "@/components/ui/display";
import { EstadoBadge } from "@/components/ui/estado-badge";
import { formatoFecha, formatoPesos, nombrePeriodo } from "@/lib/formato";
import type { LiquidacionResumen } from "@/types/api";

export function UltimaLiquidacion({ liquidacion: l }: { liquidacion: LiquidacionResumen }) {
  const filas = [
    { etiqueta: "Trabajadores", valor: String(l.numeroTrabajadores) },
    { etiqueta: "Devengado", valor: formatoPesos(l.totalDevengado) },
    { etiqueta: "Deducciones", valor: formatoPesos(l.totalDeducciones) },
  ];

  return (
    <Card className="flex flex-col">
      <CardHeader
        titulo="Última liquidación"
        descripcion={`${formatoFecha(l.fechaInicio)} – ${formatoFecha(l.fechaFin)}`}
        acciones={<EstadoBadge dominio="liquidacion" estado={l.estado} />}
      />
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div>
          <p className="text-sm font-medium text-slate-900 first-letter:uppercase">{nombrePeriodo(l)}</p>
          {l.requiereRecalculo && (
            <Badge tono="amarillo" className="mt-1">
              Requiere recálculo
            </Badge>
          )}
        </div>
        <dl className="space-y-2 text-sm">
          {filas.map((f) => (
            <div key={f.etiqueta} className="flex justify-between gap-3">
              <dt className="text-slate-500">{f.etiqueta}</dt>
              <dd className="text-slate-900 tabular-nums">{f.valor}</dd>
            </div>
          ))}
          <div className="flex justify-between gap-3 border-t border-slate-200 pt-2">
            <dt className="font-medium text-slate-700">Neto a pagar</dt>
            <dd className="font-semibold text-slate-900 tabular-nums">{formatoPesos(l.totalNeto)}</dd>
          </div>
        </dl>
        <Link
          href={`/nomina/${l.id}`}
          className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-marca-700 hover:underline"
        >
          Ver liquidación <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
    </Card>
  );
}
