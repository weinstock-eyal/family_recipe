import type { Metadata } from "next";
import { Heebo } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AppHeader } from "@/components/app-header";

const heebo = Heebo({
  variable: "--font-sans",
  subsets: ["hebrew", "latin"],
});

export const metadata: Metadata = {
  title: "מתכונים משפחתיים",
  description: "המקום המשותף למתכוני המשפחה שלנו",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <body suppressHydrationWarning className={`${heebo.variable} font-sans antialiased`}>
        <ThemeProvider>
          <AppHeader />
          <main className="mx-auto max-w-5xl px-4 py-8 sm:px-8">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
