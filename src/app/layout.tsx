import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DouhaLaribiLive · Archivo de Fans",
  description:
    "Archivo visual permanente de Douha Laribi (ضحى العريبي). Todas las fotos en un solo lugar, organizadas, buscables y listas para redescubrir.",
  keywords: [
    "Douha Laribi",
    "DouhaLaribiLive",
    "ضحى العريبي",
    "fan page",
    "archivo",
    "galería",
  ],
  authors: [{ name: "Fan Archive DouhaLaribiLive" }],
  openGraph: {
    title: "DouhaLaribiLive · Archivo de Fans",
    description:
      "Archivo visual permanente de Douha Laribi. Todas las fotos organizadas en un solo lugar.",
    siteName: "DouhaLaribiLive Archive",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
