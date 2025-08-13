import "../styles/globals.css";
import "../styles/heroui-overrides.css";
import "../styles/light-theme.css";
import { Metadata, Viewport } from "next";
import { Link } from "@heroui/link";
import clsx from "clsx";

import { Providers } from "./providers";
import { siteConfig } from "../config/site";
import { fontSans } from "../config/fonts";
import VantaBackground from "../components/VantaBackground";

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`,
  },
  description: siteConfig.description,
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning lang="en">
      <head />
      <body
        className={clsx(
       "h-screen text-foreground bg-background font-sans antialiased overflow-x-hidden",
          fontSans.variable,
        )}
      >
        <Providers>
          <VantaBackground />
          <div className="relative flex flex-col min-h-screen">
            <main className="flex-1">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
