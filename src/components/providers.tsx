"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { Toaster } from "sonner";
import { estadoHttp } from "@/lib/errores";

export function Providers({ children }: { children: ReactNode }) {
  const [cliente] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            // Errores 4xx no se reintentan: son respuestas definitivas del API.
            retry: (intentos, error) => {
              const estado = estadoHttp(error);
              return (estado === undefined || estado >= 500) && intentos < 2;
            },
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={cliente}>
      {children}
      <Toaster richColors position="top-right" closeButton />
    </QueryClientProvider>
  );
}
