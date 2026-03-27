import type { Metadata } from "next";
import { Inter, Lora, Amiri } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const lora = Lora({
  variable: "--font-serif",
  subsets: ["latin"],
});

const amiri = Amiri({
  variable: "--font-arabic",
  weight: ["400", "700"],
  subsets: ["arabic", "latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Monthly Renaissance",
    template: "%s | Monthly Renaissance",
  },
  description:
    "A journal of Islamic research and information, publishing scholarly articles on the Quran, Hadith, Islamic law, ethics, and contemporary issues since 1991.",
  keywords: [
    "Islam",
    "Quran",
    "Hadith",
    "Islamic scholarship",
    "Renaissance",
    "Ghamidi",
    "Al-Mawrid",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${lora.variable} ${amiri.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
