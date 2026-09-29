import { getPublicAppUrl } from "./app-config";

function readPublicValue(key: string, fallback: string) {
  const value = process.env[key]?.trim();
  return value || fallback;
}

export function getPublicSiteConfig() {
  const supportEmail = readPublicValue("NEXT_PUBLIC_SUPPORT_EMAIL", "support@a-renseigner.fr");
  const privacyEmail = readPublicValue("NEXT_PUBLIC_PRIVACY_EMAIL", supportEmail);
  const legalName = readPublicValue("NEXT_PUBLIC_LEGAL_NAME", "Editeur a renseigner");
  const legalStatus = readPublicValue("NEXT_PUBLIC_LEGAL_STATUS", "Statut juridique a renseigner");
  const legalAddress = readPublicValue("NEXT_PUBLIC_LEGAL_ADDRESS", "Adresse a renseigner");
  const legalPhone = readPublicValue("NEXT_PUBLIC_LEGAL_PHONE", "Telephone a renseigner");
  const legalRegistration = process.env.NEXT_PUBLIC_LEGAL_REGISTRATION?.trim() || "";
  const publicationDirector = readPublicValue(
    "NEXT_PUBLIC_PUBLICATION_DIRECTOR",
    "Responsable de publication a renseigner"
  );
  const hostingName = readPublicValue("NEXT_PUBLIC_HOSTING_NAME", "Vercel Inc.");
  const hostingAddress = readPublicValue(
    "NEXT_PUBLIC_HOSTING_ADDRESS",
    "440 N Barranca Avenue #4133, Covina, CA 91723, Etats-Unis"
  );

  const values = [supportEmail, privacyEmail, legalName, legalStatus, legalAddress, legalPhone, publicationDirector];

  return {
    appName: "Prepa ECG OS",
    appUrl: getPublicAppUrl(),
    supportEmail,
    privacyEmail,
    legalName,
    legalStatus,
    legalAddress,
    legalPhone,
    legalRegistration,
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
