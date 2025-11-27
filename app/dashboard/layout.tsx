import { ReactNode } from "react";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ClientProviders } from "@/components/providers/ClientProviders";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <ClientProviders>
        {children}
      </ClientProviders>
    </ThemeProvider>
  );
}
