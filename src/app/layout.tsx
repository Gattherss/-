import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "GrantBurner",
  description: "High-speed expense tracking for grant funds",
  manifest: "/manifest.json",
  applicationName: "GrantBurner",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "GrantBurner",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-black">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased selection:bg-cyan-500/30 selection:text-cyan-200`}
      >
        <ToastProvider>
          <div className="min-h-screen bg-background text-foreground">{children}</div>
        </ToastProvider>
      </body>
    </html>
  );
}
