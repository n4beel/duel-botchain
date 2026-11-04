import type { Metadata, Viewport } from "next";
import { Teko, Rajdhani } from "next/font/google";
import { EvmProvider } from "@/components/providers/EvmProvider";
import { ToastProvider } from "@/components/ui/Toast";
import WrongNetworkBar from "@/components/botchain/WrongNetworkBar";
import { app } from "@/lib/app-config";
import "./globals.css";

const teko = Teko({ variable: "--font-heading", subsets: ["latin"], weight: ["400", "500", "600", "700"], display: "swap" });
const rajdhani = Rajdhani({ variable: "--font-sans", subsets: ["latin"], weight: ["400", "500", "600", "700"], display: "swap" });

export const metadata: Metadata = {
  title: `${app.name} — ${app.tagline}`,
  description: app.tagline,
  openGraph: { title: app.name, description: app.tagline, type: "website", url: app.url },
};

/** `width=device-width` plus a floor on zoom. Pinch-zoom stays available; nothing is locked out. */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#FF4DC9",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${rajdhani.variable} ${teko.variable} h-full`}
      // The project's accent, written once at the root. Every component reads `var(--accent)`, so
      // this is the only place a palette change has to happen.
      style={{ ["--accent" as string]: app.accent }}
    >
      <body className="min-h-full antialiased font-sans">
        <EvmProvider>
          <WrongNetworkBar />
          <ToastProvider>{children}</ToastProvider>
        </EvmProvider>
      </body>
    </html>
  );
}
