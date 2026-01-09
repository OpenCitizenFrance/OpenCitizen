import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { AppShell } from "@/components/AppShell";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter"
});

export const metadata: Metadata = {
  title: "OpenCitizen - Suivez l'Assemblée Nationale",
  description: "Plateforme citoyenne pour suivre l'activité parlementaire, analyser les votes, et influencer la fabrique de la loi.",
  keywords: ["assemblée nationale", "députés", "votes", "loi", "citoyenneté", "démocratie"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={cn(inter.variable, "font-sans min-h-screen bg-background antialiased")}>
        <AppShell>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
