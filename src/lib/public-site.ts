import { getPublicAppUrl } from "./app-config";

function readPublicValue(key: string, fallback: string) {
  const value = process.env[key]?.trim();
  return value || fallback;
}

export function getPublicSiteConfig() {
  const supportEmail = readPublicValue("NEXT_PUBLIC_SUPPORT_EMAIL", "support@a-renseigner.fr");
  const legalName = readPublicValue("NEXT_PUBLIC_LEGAL_NAME", "Editeur a renseigner");
  const legalAddress = readPublicValue("NEXT_PUBLIC_LEGAL_ADDRESS", "Adresse a renseigner");
  const publicationDirector = readPublicValue(
    "NEXT_PUBLIC_PUBLICATION_DIRECTOR",
    "Responsable de publication a renseigner"
  );
  const hostingName = readPublicValue("NEXT_PUBLIC_HOSTING_NAME", "Hebergeur a renseigner");
  const hostingAddress = readPublicValue(
    "NEXT_PUBLIC_HOSTING_ADDRESS",
    "Adresse de l'hebergeur a renseigner"
  );

  const values = [supportEmail, legalName, legalAddress, publicationDirector, hostingName, hostingAddress];

  return {
    appName: "Prepa ECG OS",
    appUrl: getPublicAppUrl(),
    supportEmail,
    legalName,
    legalAddress,
    publicationDirector,
    hostingName,
    hostingAddress,
    isIncomplete: values.some((value) =>
      value
        .toLowerCase()
        .replaceAll("-", " ")
        .includes("a renseigner")
    )
  };
}
