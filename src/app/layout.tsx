import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";

import { InstallAppPrompt } from "@/components/pwa/install-app-prompt";
import { RegisterServiceWorker } from "@/components/pwa/register-service-worker";
import "./globals.css";

function getMetadataBase() {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!raw || raw.includes("localhost")) {
    return undefined;
  }

  try {
    return new URL(raw);
  } catch {
    return undefined;
  }
}

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: "Prepa ECG OS",
  description: "L'application de travail quotidien pour les preparationnaires ECG.",
  applicationName: "Prepa ECG OS",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Prepa ECG OS"
  },
  formatDetection: {
    telephone: false
  }
};

export const viewport: Viewport = {
  themeColor: "#14221d"
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="fr" data-theme="original">
      <body className="antialiased">
        <RegisterServiceWorker />
        <InstallAppPrompt />
        {children}
      </body>
    </html>
  );
}
