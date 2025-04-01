import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SelectedCardProvider } from "@/context/SelectedCardContext";
import Navbar from '@/components/Navbar'
import Providers from './providers';
import { Toaster } from "react-hot-toast";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Static Page Generator",
  description: "Generate static pages easily",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <Navbar />
          <SelectedCardProvider>
            {children}
          </SelectedCardProvider>
        </Providers>
        <Toaster />
      </body>
    </html>
  );
}
