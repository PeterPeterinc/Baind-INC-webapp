import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "HN-AB Collega Chat",
  description: "Praat met digitale collega's via het HN-AB platform.",
  icons: {
    icon: "/hn-ab-logo.svg",
    apple: "/hn-ab-logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/svg+xml" href="/hn-ab-logo.svg" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[--background] text-[--foreground]`}
      >
        {children}
      </body>
    </html>
  );
}
