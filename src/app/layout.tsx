import type { Metadata } from "next";
import { Inter, Lora, JetBrains_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { SessionProvider } from "@/components/auth/session-provider";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const lora = Lora({
  variable: "--font-serif",
  subsets: ["latin"],
});

const noorehuda = localFont({
  variable: "--font-arabic",
  src: "../../public/fonts/noorehuda.ttf",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
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
      className={`${inter.variable} ${lora.variable} ${noorehuda.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SessionProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </SessionProvider>
      </body>
    </html>
  );
}
