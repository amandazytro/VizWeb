import type { Metadata } from "next";
import { Red_Hat_Display, Red_Hat_Mono } from "next/font/google";
import "./globals.css";

const redHat = Red_Hat_Display({
  variable: "--font-redhat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const redHatMono = Red_Hat_Mono({
  variable: "--font-redhat-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Zytro — Experiência Imobiliária Imersiva",
  description:
    "Um tour cinematográfico e interativo de um empreendimento imobiliário premium.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${redHat.variable} ${redHatMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
