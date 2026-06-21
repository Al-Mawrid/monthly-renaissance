import type { Metadata } from "next";
import { Inter, Lora, JetBrains_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { SessionProvider } from "@/components/auth/session-provider";
import { FeedbackProvider } from "@/components/feedback/feedback-provider";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const lora = Lora({
  variable: "--font-serif",
  subsets: ["latin"],
});

// Noor-e-Huda is scoped to Arabic-script codepoints via unicode-range so it can
// sit FIRST in every font stack without touching Latin: the browser only reaches
// for it on Arabic/Urdu glyphs and lets Latin fall through to Inter/Lora. This is
// what makes unclassed inline Arabic (legacy <p> content with no .ArabicInLineText
// wrapper) render in Noor-e-Huda. adjustFontFallback is off because its Arial
// fallback face carries Arabic glyphs and would otherwise win Arabic first.
const noorehuda = localFont({
  variable: "--font-arabic",
  src: "../../public/fonts/noorehuda.ttf",
  display: "swap",
  adjustFontFallback: false,
  declarations: [
    {
      prop: "unicode-range",
      value:
        "U+0600-06FF, U+0750-077F, U+08A0-08FF, U+FB50-FDFF, U+FE70-FEFF, U+200C-200D",
    },
  ],
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
          <FeedbackProvider>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </FeedbackProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
