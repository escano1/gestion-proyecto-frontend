import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

/** Tabla con desplazamiento horizontal en pantallas pequeñas. */
export function Table({ className, ...props }: ComponentProps<"table">) {
  return (
    <div className="overflow-x-auto">
      <table className={cn("min-w-full divide-y divide-slate-200 text-sm", className)} {...props} />
    </div>
  );
}

export function Th({ className, alinear, ...props }: ComponentProps<"th"> & { alinear?: "derecha" | "centro" }) {
  return (
    <th
      scope="col"
      className={cn(
        "bg-slate-50 px-3 py-2.5 text-left text-xs font-semibold tracking-wide whitespace-nowrap text-slate-600 uppercase",
        alinear === "derecha" && "text-right",
        alinear === "centro" && "text-center",
        className,
      )}
      {...props}
    />
  );
}

export function Td({ className, alinear, ...props }: ComponentProps<"td"> & { alinear?: "derecha" | "centro" }) {
  return (
    <td
      className={cn(
        "px-3 py-2.5 text-slate-700",
        alinear === "derecha" && "text-right tabular-nums",
        alinear === "centro" && "text-center",
        className,
      )}
      {...props}
    />
  );
}

export function Tr({ className, ...props }: ComponentProps<"tr">) {
  return <tr className={cn("hover:bg-slate-50/70", className)} {...props} />;
}

export function TBody({ className, ...props }: ComponentProps<"tbody">) {
  return <tbody className={cn("divide-y divide-slate-100 bg-white", className)} {...props} />;
}
