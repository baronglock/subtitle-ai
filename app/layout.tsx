import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import NextAuthSessionProvider from "./contexts/SessionProvider";
import Navigation from "./components/Navigation";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SubtitleAI - Professional AI-Powered Transcription & Subtitles",
  description: "Generate accurate subtitles and transcriptions in any language using advanced AI technology",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={`${inter.className} antialiased bg-white dark:bg-gray-900 text-gray-900 dark:text-white`}>
        <NextAuthSessionProvider>
          <LanguageProvider>
            <ThemeProvider>
              <Navigation />
              <main className="pt-16">
                {children}
              </main>
            </ThemeProvider>
          </LanguageProvider>
        </NextAuthSessionProvider>
      </body>
    </html>
  );
}
