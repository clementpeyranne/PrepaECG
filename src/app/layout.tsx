import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";

import { Aurora } from "@/components/motion/aurora";
import { MotionEffects } from "@/components/motion/motion-effects";
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

const themeBootstrap =
  "try{var t=localStorage.getItem('prepa-theme');if(t&&/^(original|capsule|atelier|night|pulse|velours|campus)$/.test(t))document.documentElement.dataset.theme=t}catch(e){}";

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: "Prépatempo",
  description: "L'application de travail quotidien pour les préparationnaires ECG.",
  applicationName: "Prépatempo",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Prépatempo"
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
    <html lang="fr" data-theme="original" suppressHydrationWarning>
      <head>
        {/* Applique l'ambiance choisie avant l'affichage, sur toutes les pages. */}
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body className="antialiased">
        <Aurora />
        <MotionEffects />
        <RegisterServiceWorker />
        <InstallAppPrompt />
        {children}
      </body>
    </html>
  );
}
