import Link from "next/link";
import { Card, CardHeader, EmptyState } from "@/components/ui/display";
import { EstadoBadge } from "@/components/ui/estado-badge";
import { BarrasAvance } from "@/features/reportes-ui/barra-avance";
import type { Dashboard } from "@/types/api";

export function AvanceProyectos({ proyectos }: { proyectos: Dashboard["avanceProyectos"] }) {
  return (
    <Card>
      <CardHeader titulo="Avance de proyectos" descripcion="Avance real frente al planeado según los hitos de cada proyecto" />
      {proyectos.length === 0 ? (
        <EmptyState titulo="Sin proyectos activos" />
      ) : (
        <ul className="divide-y divide-slate-100">
          {proyectos.map((p) => (
            <li key={p.id} className="grid gap-2 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_auto] sm:items-center sm:gap-4">
              <Link href={`/proyectos/${p.id}`} className="min-w-0 text-sm hover:underline">
                <span className="font-medium text-marca-700">{p.codigo}</span>
                <span className="block truncate text-slate-600">{p.nombre}</span>
              </Link>
              <BarrasAvance real={p.avanceReal} planeado={p.avancePlaneado} />
              <div className="sm:justify-self-end">
                <EstadoBadge dominio="avance" estado={p.estado} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
