"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { useReporteHoras, type RangoFechas } from "@/features/reportes/api";
import { useProyectos, useTrabajadores } from "@/features/personal/api";
import { useTiposHora } from "@/features/catalogos/api";
import { mensajeError } from "@/lib/errores";
import { formatoHoras, formatoNumero, formatoPesos } from "@/lib/formato";
import { cn } from "@/lib/cn";
import { opciones } from "@/lib/etiquetas";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, EmptyState, ErrorState, Spinner } from "@/components/ui/display";
import { Field, Select } from "@/components/ui/form-controls";
import { Table, TBody, Td, Th, Tr } from "@/components/ui/table";
import type { AgrupacionHoras, CodigoTipoHora } from "@/types/api";
import { descargarCsv, generarCsv } from "./csv";
import { BarraFiltros, FiltroRango } from "./filtros";
import { GraficoReporteHoras } from "./graficos-reportes";
import { AGRUPACIONES, etiquetaFila, tablaCsvHoras, tiposPresentes, totalesPorTipo } from "./reporte-horas";

const aId = (valor: string) => (valor ? Number(valor) : undefined);

export function ReporteHorasTab({ rango, onCambiarRango }: { rango: RangoFechas; onCambiarRango: (r: RangoFechas) => void }) {
  const [agrupacion, setAgrupacion] = useState<AgrupacionHoras>("trabajador");
  const [trabajadorId, setTrabajadorId] = useState<number>();
  const [proyectoId, setProyectoId] = useState<number>();
  const consulta = useReporteHoras({ ...rango, agrupacion, trabajadorId, proyectoId });
  const trabajadores = useTrabajadores();
  const proyectos = useProyectos();
  const tipos = useTiposHora();

  const nombreTipo = (codigo: CodigoTipoHora) => tipos.data?.find((t) => t.codigo === codigo)?.nombre ?? codigo;

  const exportar = () => {
    if (!consulta.data) return;
    const { encabezados, filas } = tablaCsvHoras(consulta.data, nombreTipo);
    descargarCsv(`reporte-horas_${consulta.data.desde}_${consulta.data.hasta}.csv`, generarCsv(encabezados, filas));
  };

  const reporte = consulta.data;
  const codigos = reporte ? tiposPresentes(reporte.filas) : [];
  const totalTipo = reporte ? totalesPorTipo(reporte.filas, codigos) : null;

  return (
    <div className="space-y-6">
      <Card>
        <BarraFiltros>
          <FiltroRango rango={rango} onCambiar={onCambiarRango} />
          <Field label="Agrupar por" className="w-full sm:w-40">
            {(id) => (
              <Select id={id} value={agrupacion} onChange={(e) => setAgrupacion(e.target.value as AgrupacionHoras)}>
                {opciones(AGRUPACIONES).map((o) => (
                  <option key={o.valor} value={o.valor}>
                    {o.etiqueta}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Trabajador" className="w-full sm:w-56">
            {(id) => (
              <Select id={id} value={trabajadorId ?? ""} onChange={(e) => setTrabajadorId(aId(e.target.value))}>
                <option value="">Todos</option>
                {trabajadores.data?.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nombre}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Proyecto" className="w-full sm:w-56">
            {(id) => (
              <Select id={id} value={proyectoId ?? ""} onChange={(e) => setProyectoId(aId(e.target.value))}>
                <option value="">Todos</option>
                {proyectos.data?.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.codigo} · {p.nombre}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Button variante="secundario" className="sm:ml-auto" onClick={exportar} disabled={!reporte || reporte.filas.length === 0}>
            <Download className="size-4" aria-hidden /> Exportar CSV
          </Button>
        </BarraFiltros>

        {consulta.isPending ? (
          <Spinner />
        ) : consulta.isError ? (
          <ErrorState mensaje={mensajeError(consulta.error)} reintentar={() => consulta.refetch()} />
        ) : consulta.data.filas.length === 0 ? (
          <EmptyState titulo="Sin horas en el rango" descripcion="Ajuste las fechas o los filtros." />
        ) : (
          <div className={cn("transition-opacity", consulta.isPlaceholderData && "opacity-60")} aria-busy={consulta.isFetching}>
            <Table>
              <thead>
                <tr>
                  <Th>{AGRUPACIONES[consulta.data.agrupacion]}</Th>
                  {codigos.map((codigo) => (
                    <Th key={codigo} alinear="derecha">
                      <abbr title={nombreTipo(codigo)} className="no-underline">
                        {codigo}
                      </abbr>
                    </Th>
                  ))}
                  <Th alinear="derecha">Horas</Th>
                  <Th alinear="derecha">Extra</Th>
                  <Th alinear="derecha">Costo</Th>
                </tr>
              </thead>
              <TBody>
                {consulta.data.filas.map((f) => (
                  <Tr key={f.clave}>
                    <Td className="font-medium text-slate-900">{etiquetaFila(f.etiqueta)}</Td>
                    {codigos.map((codigo) => (
                      <Td key={codigo} alinear="derecha" className="text-slate-500">
                        {f.porTipo[codigo] ? formatoNumero(f.porTipo[codigo]) : "—"}
                      </Td>
                    ))}
                    <Td alinear="derecha">{formatoHoras(f.horas)}</Td>
                    <Td alinear="derecha" className={cn(f.horasExtra > 0 && "text-amber-800")}>
                      {formatoHoras(f.horasExtra)}
                    </Td>
                    <Td alinear="derecha" className="whitespace-nowrap">
                      {formatoPesos(f.costo)}
                    </Td>
                  </Tr>
                ))}
              </TBody>
              <tfoot className="border-t-2 border-slate-200 bg-slate-50 font-semibold">
                <tr>
                  <Td className="text-slate-900">Total</Td>
                  {codigos.map((codigo) => (
                    <Td key={codigo} alinear="derecha">
                      {formatoNumero(totalTipo?.[codigo])}
                    </Td>
                  ))}
                  <Td alinear="derecha">{formatoHoras(consulta.data.totales.horas)}</Td>
                  <Td alinear="derecha">{formatoHoras(consulta.data.totales.horasExtra)}</Td>
                  <Td alinear="derecha" className="whitespace-nowrap">
                    {formatoPesos(consulta.data.totales.costo)}
                  </Td>
                </tr>
              </tfoot>
            </Table>
          </div>
        )}
      </Card>

      {consulta.data && consulta.data.filas.length > 0 && (
        <Card>
          <CardHeader
            titulo={`Horas por ${AGRUPACIONES[consulta.data.agrupacion].toLowerCase()}`}
            descripcion="Jornada (con recargos) y horas extra"
          />
          <GraficoReporteHoras reporte={consulta.data} />
        </Card>
      )}
    </div>
  );
}
