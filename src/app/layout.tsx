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
  title: "Douhal Aribi Live · Fan Gallery",
  description:
    "Galería no oficial dedicada a Douhal Aribi. Explora, busca y redescubre los mejores momentos en un solo lugar.",
  keywords: [
    "Douhal Aribi",
    "Douhal Aribi Live",
    "fan page",
    "galería",
    "fotos",
    "Instagram",
  ],
  authors: [{ name: "Fan Page Douhal Aribi Live" }],
  openGraph: {
    title: "Douhal Aribi Live · Fan Gallery",
    description:
      "Todas las imágenes de Douhal Aribi organizadas, buscables y listas para redescubrir.",
    siteName: "Douhal Aribi Live",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Douhal Aribi Live · Fan Gallery",
    description:
      "Todas las imágenes de Douhal Aribi organizadas, buscables y listas para redescubrir.",
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
