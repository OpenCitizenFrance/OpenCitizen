import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { Navbar } from "@/components/Navbar";
import { cn } from "@/lib/utils";

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
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <Navbar />
            <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
              <div className="max-w-7xl mx-auto w-full">
                {children}
              </div>
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
