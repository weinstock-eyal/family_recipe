import type { Metadata } from "next";
import { Heebo } from "next/font/google";
import "./globals.css";

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
        {children}
      </body>
    </html>
  );
}
