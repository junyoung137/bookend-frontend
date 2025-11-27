// app/layout.tsx
import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ClientProviders } from "@/components/providers/ClientProviders";
import { I18nProvider } from "@/lib/I18nProvider";

const pretendard = localFont({
  src: "./fonts/PretendardVariable.woff2",
  variable: "--font-pretendard",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Bookend - 당신의 이야기를 시작하세요",
  description: "AI 기반 글쓰기 도우미",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body
        className={cn(
          pretendard.variable,
          "font-sans",
          "antialiased"
        )}
      >
        {/* 🔥 언어 Provider를 최상위에 배치 */}
        <I18nProvider>
          <ThemeProvider>
            <ClientProviders>{children}</ClientProviders>
          </ThemeProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
