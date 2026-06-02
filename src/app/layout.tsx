import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navigation from "@/components/Navigation";

export const metadata: Metadata = {
  title: "Pure Desire — Private Indian Couple Intimacy & Kama Sutra Portal",
  description: "A secure, premium sensual sanctuary for consenting Indian couples to deep-dive into adult conversation, Kama Sutra positions, and spicy bedroom games.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Pure Desire",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#07030c",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased dark scroll-smooth" suppressHydrationWarning>
      <body className="min-h-full bg-[#050107] flex flex-col justify-start" suppressHydrationWarning>
        {/* Core Mobile Frame Container */}
        <div className="mobile-viewport min-h-screen flex flex-col pb-24 relative select-none">
          {/* Sensual Ambient Background Blob */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-sensual-pink/5 blur-[80px] pointer-events-none -z-10 animate-sensual-pulse" />
          <div className="absolute bottom-1/4 left-1/3 w-64 h-64 rounded-full bg-sensual-purple/10 blur-[80px] pointer-events-none -z-10 animate-sensual-pulse" />

          {/* Child Page Rendering */}
          <main className="flex-1 w-full flex flex-col">
            {children}
          </main>

          {/* Floating Dock Navigation */}
          <Navigation />
        </div>
      </body>
    </html>
  );
}
