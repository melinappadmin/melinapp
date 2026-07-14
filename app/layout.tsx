import type { Metadata } from "next";
import "./globals.css";
import "./mobile.css";
import "./mobile-fixes.css";
import Pwa from "./Pwa";

export const metadata: Metadata = {
  title: "Melin APP | Gestão e reposição",
  description: "Gestão de estoque, clientes, pontos de venda e rotas de reposição da Paieiro Melin.",
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body><Pwa/>{children}</body></html>;
}
