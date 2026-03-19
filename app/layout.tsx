import type { Metadata, Viewport } from "next";
import { Heebo } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AppHeader } from "@/components/app-header";
import { MobileNav } from "@/components/mobile-nav";

const heebo = Heebo({
  variable: "--font-sans",
  subsets: ["hebrew", "latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#6366F1",
};

export const metadata: Metadata = {
  title: "מתכונים משפחתיים",
  description: "המקום המשותף למתכוני המשפחה שלנו",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "מתכונים משפחתיים",
  },
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
          <main className="mx-auto max-w-5xl px-4 py-6 pb-24 sm:px-8 sm:py-8 sm:pb-8">
            {children}
          </main>
          <MobileNav />
        </ThemeProvider>
      </body>
    </html>
  );
}
