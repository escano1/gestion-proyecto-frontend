"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import { useHistorialAsignaciones, useTrabajador } from "@/features/personal/api";
import { useRegistrosHoras } from "@/features/horas/api";
import { TrabajadorForm } from "@/features/personal/trabajador-form";
import { useSesion } from "@/lib/auth-store";
import { puedeEscribir } from "@/lib/permisos";
import { mensajeError } from "@/lib/errores";
import { formatoFecha, formatoHoras, formatoPesos } from "@/lib/formato";
import { TIPOS_CONTRATO, TIPOS_JORNADA, TIPOS_SALARIO } from "@/lib/etiquetas";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, DataList, EmptyState, ErrorState, PageHeader, Spinner } from "@/components/ui/display";
import { EstadoBadge } from "@/components/ui/estado-badge";
import { Table, TBody, Td, Th, Tr } from "@/components/ui/table";

export default function PaginaTrabajador() {
  const { id } = useParams<{ id: string }>();
  const trabajadorId = Number(id);
  const rol = useSesion((s) => s.usuario?.rol);
  const trabajador = useTrabajador(trabajadorId);
  const historial = useHistorialAsignaciones(trabajadorId);
  const horas = useRegistrosHoras({ trabajadorId, limite: 10 });
  const [editando, setEditando] = useState(false);

  if (trabajador.isPending) return <Spinner />;
  if (trabajador.isError) return <ErrorState mensaje={mensajeError(trabajador.error)} reintentar={() => trabajador.refetch()} />;

  const t = trabajador.data;

  return (
    <>
      <Link href="/trabajadores" className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="size-4" /> Trabajadores
      </Link>
      <PageHeader
        titulo={t.nombre}
        descripcion={`${t.cargo} · ${t.tipoDocumento} ${t.numeroDocumento}`}
        acciones={
          puedeEscribir(rol, "trabajadores") && (
            <Button variante="secundario" onClick={() => setEditando(true)}>
              <Pencil className="size-4" /> Editar
            </Button>
          )
        }
      />

      <div className="space-y-6">
        <Card>
          <CardHeader titulo="Datos laborales" acciones={<EstadoBadge dominio="trabajador" estado={t.estado} />} />
          <div className="p-4">
            <DataList
              items={[
                { etiqueta: "Tipo de salario", valor: TIPOS_SALARIO[t.tipoSalario] },
                {
                  etiqueta: t.tipoSalario === "POR_HORA" ? "Valor hora" : "Salario mensual",
                  valor: formatoPesos(t.salarioBase),
                },
                { etiqueta: "Contrato", valor: TIPOS_CONTRATO[t.tipoContrato] },
                {
                  etiqueta: "Jornada",
                  valor: t.tipoJornada === "PARCIAL" ? `Parcial · ${t.horasSemanales} h/semana` : TIPOS_JORNADA.COMPLETA,
                },
                { etiqueta: "Auxilio de transporte", valor: t.aplicaAuxilioTransporte ? "Aplica (si devenga ≤ 2 SMMLV)" : "No aplica" },
                { etiqueta: "EPS", valor: t.eps ?? "—" },
                { etiqueta: "Fondo de pensión", valor: t.fondoPension ?? "—" },
                { etiqueta: "Teléfono", valor: t.telefono ?? "—" },
                { etiqueta: "Correo", valor: t.email ?? "—" },
              ]}
            />
          </div>
        </Card>

        <Card>
          <CardHeader titulo="Historial de proyectos" descripcion="Proyectos en los que está asignado" />
          {historial.isPending ? (
            <Spinner />
          ) : historial.isError ? (
            <ErrorState mensaje={mensajeError(historial.error)} />
          ) : historial.data.length === 0 ? (
            <EmptyState titulo="Sin asignaciones" />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Proyecto</Th>
                  <Th>Rol</Th>
                </tr>
              </thead>
              <TBody>
                {historial.data.map((a) => (
                  <Tr key={a.id}>
                    <Td>
                      <Link href={`/proyectos/${a.proyecto.id}`} className="text-marca-700 hover:underline">
                        {a.proyecto.codigo} · {a.proyecto.nombre}
                      </Link>
                    </Td>
                    <Td>{a.rolEnProyecto ?? "—"}</Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          )}
        </Card>

        <Card>
          <CardHeader titulo="Últimos registros de horas" />
          {horas.isPending ? (
            <Spinner />
          ) : horas.isError ? (
            <ErrorState mensaje={mensajeError(horas.error)} />
          ) : horas.data.datos.length === 0 ? (
            <EmptyState titulo="Sin horas registradas" />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Fecha</Th>
                  <Th>Proyecto</Th>
                  <Th>Detalle</Th>
                  <Th alinear="derecha">Total</Th>
                </tr>
              </thead>
              <TBody>
                {horas.data.datos.map((r) => (
                  <Tr key={r.id}>
                    <Td className="whitespace-nowrap">{formatoFecha(r.fecha)}</Td>
                    <Td>{r.proyecto.codigo}</Td>
                    <Td className="text-xs text-slate-500">
                      {r.detalles.map((d) => `${d.codigo} ${d.horas}`).join(" · ")}
                    </Td>
                    <Td alinear="derecha">{formatoHoras(r.totalHoras)}</Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          )}
        </Card>
      </div>

      <TrabajadorForm abierto={editando} trabajador={t} onCerrar={() => setEditando(false)} />
    </>
  );
}
