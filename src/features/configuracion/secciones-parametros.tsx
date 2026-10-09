"use client";

import { Plus, Trash2 } from "lucide-react";
import { useParametrosVigentes, useTiposHora } from "@/features/catalogos/api";
import { mensajeError } from "@/lib/errores";
import { formatoFecha, formatoFechaHora, formatoPorcentaje } from "@/lib/formato";
import { Button } from "@/components/ui/button";
import { Badge, Card, CardHeader, EmptyState, ErrorState, Spinner } from "@/components/ui/display";
import { Table, TBody, Td, Th, Tr } from "@/components/ui/table";
import type { CodigoParametro, ParametroLegal } from "@/types/api";
import { formatoValorParametro, GRUPOS_VIGENTES, type GrupoParametro } from "./parametros";

/** Valores aplicables hoy, agrupados por tema. */
export function ValoresVigentes() {
  const consulta = useParametrosVigentes();

  if (consulta.isPending) return <Spinner />;
  if (consulta.isError) {
    return (
      <Card>
        <ErrorState mensaje={mensajeError(consulta.error)} reintentar={() => consulta.refetch()} />
      </Card>
    );
  }

  const { valores, fecha } = consulta.data;
  return (
    <section aria-labelledby="titulo-vigentes">
      <h2 id="titulo-vigentes" className="mb-3 text-sm font-semibold text-slate-900">
        Valores vigentes al {formatoFecha(fecha)}
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {GRUPOS_VIGENTES.map((grupo) => (
          <Card key={grupo.titulo} className="p-4">
            <h3 className="text-xs font-semibold tracking-wide text-slate-500 uppercase">{grupo.titulo}</h3>
            <dl className="mt-3 space-y-2">
              {grupo.items.map((item) => (
                <div key={item.clave} className="flex items-baseline justify-between gap-3">
                  <dt className="text-sm text-slate-600">{item.etiqueta}</dt>
                  <dd className="text-sm font-semibold whitespace-nowrap text-slate-900 tabular-nums">
                    {formatoValorParametro(valores[item.clave], item.unidad)}
                  </dd>
                </div>
              ))}
            </dl>
          </Card>
        ))}
      </div>
    </section>
  );
}

/** Tipos de hora con el recargo vigente hoy. */
export function TablaTiposHora() {
  const consulta = useTiposHora();

  return (
    <Card>
      <CardHeader titulo="Tipos de hora" descripcion="Recargo vigente hoy sobre el valor de la hora ordinaria" />
      {consulta.isPending ? (
        <Spinner />
      ) : consulta.isError ? (
        <ErrorState mensaje={mensajeError(consulta.error)} reintentar={() => consulta.refetch()} />
      ) : consulta.data.length === 0 ? (
        <EmptyState titulo="Sin tipos de hora configurados" />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Código</Th>
              <Th>Nombre</Th>
              <Th>Clasificación</Th>
              <Th alinear="derecha">Recargo</Th>
              <Th>Estado</Th>
            </tr>
          </thead>
          <TBody>
            {consulta.data.map((t) => (
              <Tr key={t.id}>
                <Td className="font-mono text-xs font-semibold text-slate-900">{t.codigo}</Td>
                <Td>
                  {t.nombre}
                  {t.descripcion && <span className="block text-xs text-slate-500">{t.descripcion}</span>}
                </Td>
                <Td>
                  <div className="flex flex-wrap gap-1">
                    {t.esExtra && <Badge tono="amarillo">Extra</Badge>}
                    {t.esNocturna && <Badge tono="azul">Nocturna</Badge>}
                    {t.esDominicalFestiva && <Badge tono="azul">Dominical/festiva</Badge>}
                    {!t.esExtra && !t.esNocturna && !t.esDominicalFestiva && <Badge>Ordinaria</Badge>}
                  </div>
                </Td>
                <Td alinear="derecha" className="font-medium">
                  {formatoPorcentaje(t.recargo)}
                </Td>
                <Td>{t.activo ? <Badge tono="verde">Activo</Badge> : <Badge>Inactivo</Badge>}</Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      )}
    </Card>
  );
}

interface HistorialProps {
  grupos: GrupoParametro[];
  fecha: string;
  editable: boolean;
  onAgregar: (codigo: CodigoParametro) => void;
  onEliminar: (vigencia: ParametroLegal) => void;
}

/** Historial de vigencias agrupado por parámetro. */
export function HistorialVigencias({ grupos, fecha, editable, onAgregar, onEliminar }: HistorialProps) {
  if (grupos.length === 0) return <EmptyState titulo="Sin parámetros registrados" />;

  return (
    <Table>
      <thead>
        <tr>
          <Th>Vigente desde</Th>
          <Th alinear="derecha">Valor</Th>
          <Th>Norma</Th>
          <Th className="hidden md:table-cell">Registrado</Th>
          <Th>
            <span className="sr-only">Estado</span>
          </Th>
          {editable && (
            <Th className="w-12">
              <span className="sr-only">Acciones</span>
            </Th>
          )}
        </tr>
      </thead>
      {grupos.map((g) => (
        <TBody key={g.codigo}>
          <tr className="bg-slate-50/80">
            <th scope="rowgroup" colSpan={5} className="px-3 py-2 text-left text-sm font-semibold text-slate-900">
              {g.nombre}
              <span className="ml-2 font-mono text-xs font-normal text-slate-500">{g.codigo}</span>
            </th>
            {editable && (
              <td className="px-3 py-1.5 text-right">
                <Button variante="fantasma" tamano="sm" onClick={() => onAgregar(g.codigo)} aria-label={`Agregar vigencia de ${g.nombre}`}>
                  <Plus className="size-4" />
                </Button>
              </td>
            )}
          </tr>
          {g.vigencias.map((v) => (
            <Tr key={v.id}>
              <Td className="whitespace-nowrap">{formatoFecha(v.vigenteDesde)}</Td>
              <Td alinear="derecha" className="font-medium whitespace-nowrap text-slate-900">
                {formatoValorParametro(v.valor, g.unidad)}
              </Td>
              <Td className="text-slate-600">{v.norma ?? "—"}</Td>
              <Td className="hidden text-xs whitespace-nowrap text-slate-500 md:table-cell">{formatoFechaHora(v.creadoEn)}</Td>
              <Td>
                {v.id === g.idVigente ? (
                  <Badge tono="verde">Vigente</Badge>
                ) : v.vigenteDesde > fecha ? (
                  <Badge tono="azul">Programada</Badge>
                ) : null}
              </Td>
              {editable && (
                <Td className="text-right">
                  <Button
                    variante="fantasma"
                    tamano="sm"
                    onClick={() => onEliminar(v)}
                    aria-label={`Eliminar vigencia de ${g.nombre} desde ${formatoFecha(v.vigenteDesde)}`}
                  >
                    <Trash2 className="size-4 text-red-600" />
                  </Button>
                </Td>
              )}
            </Tr>
          ))}
        </TBody>
      ))}
    </Table>
  );
}
