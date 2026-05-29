import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { FedaPayScriptProvider } from "@/components/FedaPayScript";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LBP Records — Production Musicale",
  description:
    "Écoutez, achetez et produisez de la musique. Connectez artistes, beatmakers et experts musicaux.",
  icons: {
    icon: "/logo.jpeg",
    apple: "/logo.jpeg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <FedaPayScriptProvider>{children}</FedaPayScriptProvider>
      </body>
    </html>
  );
}
