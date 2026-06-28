import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";

import { InstallAppPrompt } from "@/components/pwa/install-app-prompt";
import { RegisterServiceWorker } from "@/components/pwa/register-service-worker";
import { getPublicAppUrlDetails } from "@/lib/app-config";
import "./globals.css";

function getMetadataBase() {
  const { url, source } = getPublicAppUrlDetails();
  if (source === "local") {
    return undefined;
  }

  try {
    return new URL(url);
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
  themeColor: "#14221d",
  viewportFit: "cover"
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
