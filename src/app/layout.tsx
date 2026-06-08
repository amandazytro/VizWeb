import type { Metadata } from "next";
import { Red_Hat_Display, Red_Hat_Mono, Plus_Jakarta_Sans, Poppins } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const redHat = Red_Hat_Display({
  variable: "--font-redhat",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const redHatMono = Red_Hat_Mono({
  variable: "--font-redhat-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

// Gallery copy — heading (SemiBold) + description, per the Áreas Comuns galleries.
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

// Brand display serif — used for "THE VERTICAL" and large titles.
const recia = localFont({
  variable: "--font-recia",
  src: [{ path: "../fonts/ReciaDisplay-Bold.ttf", weight: "700", style: "normal" }],
  display: "swap",
});

// Editorial serif (Canela Deck) — large display headings.
const canela = localFont({
  variable: "--font-canela",
  src: [
    { path: "../fonts/CanelaDeck-Light-Trial.otf", weight: "300", style: "normal" },
    { path: "../fonts/CanelaDeck-Regular-Trial.otf", weight: "400", style: "normal" },
    { path: "../fonts/CanelaDeck-Bold-Trial.otf", weight: "700", style: "normal" },
  ],
  display: "swap",
});

// Canela Condensed — vertical titles in the Áreas Comuns galleries.
const canelaCondensed = localFont({
  variable: "--font-canela-condensed",
  src: [
    { path: "../fonts/CanelaCondensed-Light-Trial.otf", weight: "300", style: "normal" },
    { path: "../fonts/CanelaCondensed-LightItalic-Trial.otf", weight: "300", style: "italic" },
    { path: "../fonts/CanelaCondensed-Regular-Trial.otf", weight: "400", style: "normal" },
    { path: "../fonts/CanelaCondensed-RegularItalic-Trial.otf", weight: "400", style: "italic" },
    { path: "../fonts/CanelaCondensed-Medium-Trial.otf", weight: "500", style: "normal" },
    { path: "../fonts/CanelaCondensed-MediumItalic-Trial.otf", weight: "500", style: "italic" },
    { path: "../fonts/CanelaCondensed-Bold-Trial.otf", weight: "700", style: "normal" },
    { path: "../fonts/CanelaCondensed-BoldItalic-Trial.otf", weight: "700", style: "italic" },
  ],
  display: "swap",
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
        className={`${redHat.variable} ${redHatMono.variable} ${jakarta.variable} ${poppins.variable} ${recia.variable} ${canela.variable} ${canelaCondensed.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
