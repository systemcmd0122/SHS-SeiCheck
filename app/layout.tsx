import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { SwRegister } from "./sw-register";
import { CacheClearer } from "./cache-clearer";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { PwaUpdateToast } from "@/components/PwaUpdateToast";
import { PwaInstallBanner } from "@/components/PwaInstallBanner";
import { Toaster } from "@/components/ui/toast-simple";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: "生徒会出欠管理システム",
  description: "生徒会メンバーの出欠を管理するアプリケーション",
  manifest: "/manifest.json",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
  ),
  openGraph: {
    title: "生徒会出欠管理システム",
    description: "生徒会メンバーの出欠を管理するアプリケーション",
    url: "/",
    siteName: "SHS SeiCheck",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "生徒会出欠管理システム",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "生徒会出欠管理システム",
    description: "生徒会メンバーの出欠を管理するアプリケーション",
    images: ["/og-image.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "出欠管理",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="出欠管理" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="msapplication-TileColor" content="#2d3748" />
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#000000" media="(prefers-color-scheme: dark)" />

        {/* プリコネクト */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
          <SwRegister />
          <CacheClearer />
          <OfflineIndicator />
          <PwaUpdateToast />
          <PwaInstallBanner />
        </ThemeProvider>

      </body>
    </html>
  );
}
