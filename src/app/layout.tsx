import type { Metadata } from "next";
import "./globals.css";

import { AuthProvider } from "@/context/AuthContext";
import { DateFilterProvider } from '@/context/DateFilterContext';
import AppLayoutWrapper from "@/components/AppLayoutWrapper";

export const metadata: Metadata = {
  title: "Lumin Finance — Gestão Financeira Inteligente",
  description: "Gerenciador de finanças pessoais com IA, extrato em tempo real e projeção patrimonial",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon-192.png",
    shortcut: "/icon-192.png",
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Lumin Finance",
  },
};

export const viewport = {
  themeColor: "#050505",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

import RegisterSW from "@/components/RegisterSW";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        <RegisterSW />
        <AuthProvider>
          <DateFilterProvider>
            <AppLayoutWrapper>{children}</AppLayoutWrapper>
          </DateFilterProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
