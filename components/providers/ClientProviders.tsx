// components/providers/ClientProviders.tsx
"use client";

import { I18nProvider } from "@/lib/I18nProvider";   
import { ReactNode } from "react";

export function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <I18nProvider>
      {children}
    </I18nProvider>
  );
}
