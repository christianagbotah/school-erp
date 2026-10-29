import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "iEduPro — School ERP by Lightworld Technologies",
  description:
    "Complete Ghana basic-school management platform: admissions, attendance, SBA & exams, fees with offline-first collections, GH ₵ accounting. Built by Lightworld Technologies Ltd., Ghana.",
  keywords: ["school ERP", "Ghana education", "iEduPro", "school management", "NaCCA", "BECE", "fees", "attendance"],
  authors: [{ name: "Lightworld Technologies Ltd." }],
  applicationName: "iEduPro",
};

export const viewport: Viewport = {
  themeColor: "#0d7a5a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
        <SonnerToaster position="top-center" richColors />
      </body>
    </html>
  );
}
