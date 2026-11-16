import { getPublicAppUrl } from "./app-config";

function readPublicValue(key: string, fallback: string) {
  const value = process.env[key]?.trim();
  return value && !isUnfilled(value) ? value : fallback;
}

function isUnfilled(value: string) {
  const normalized = value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replaceAll("-", " ").trim();
  return !normalized || /a renseigner|a completer|a remplacer|a confirmer|ton domaine|nom de la structure|adresse complete|telephone de contact|nom du responsable|forme juridique ou|siren ou autre immatriculation/.test(normalized);
}

export function getPublicSiteConfig() {
  const supportEmail = readPublicValue("NEXT_PUBLIC_SUPPORT_EMAIL", "prepacoach7@gmail.com");
  const privacyEmail = readPublicValue("NEXT_PUBLIC_PRIVACY_EMAIL", supportEmail);
  const legalName = readPublicValue("NEXT_PUBLIC_LEGAL_NAME", "Clément Peyranne");
  const legalStatus = readPublicValue("NEXT_PUBLIC_LEGAL_STATUS", "personne physique portant un projet personnel, sans entreprise immatriculée");
  const legalAddress = readPublicValue("NEXT_PUBLIC_LEGAL_ADDRESS", "Adresse a renseigner");
  const legalPhone = readPublicValue("NEXT_PUBLIC_LEGAL_PHONE", "Téléphone a renseigner");
  const legalRegistration = readPublicValue("NEXT_PUBLIC_LEGAL_REGISTRATION", "");
  const publicationDirector = readPublicValue(
    "NEXT_PUBLIC_PUBLICATION_DIRECTOR",
    "Clément Peyranne"
  );
  const hostingName = readPublicValue("NEXT_PUBLIC_HOSTING_NAME", "Vercel Inc.");
  const hostingAddress = readPublicValue(
    "NEXT_PUBLIC_HOSTING_ADDRESS",
    "440 N Barranca Avenue #4133, Covina, CA 91723, Etats-Unis"
  );
  const hostingPhone = readPublicValue("NEXT_PUBLIC_HOSTING_PHONE", "Téléphone à confirmer auprès de Vercel");
  const storageLegalName = readPublicValue("NEXT_PUBLIC_STORAGE_LEGAL_NAME", "Supabase Pte. Ltd.");
  const storageLegalAddress = readPublicValue("NEXT_PUBLIC_STORAGE_LEGAL_ADDRESS", "65 Chulia Street #38-02/03, OCBC Centre, Singapore 049513");

  const fields = [
    ["Adresse de contact du support", supportEmail], ["Contact pour les données personnelles", privacyEmail],
    ["Identité de l'éditeur", legalName], ["Statut de l'éditeur", legalStatus],
    ["Adresse de l'éditeur ou conditions de publication d'un site personnel", legalAddress],
    ["Téléphone de l'éditeur ou conditions de publication d'un site personnel", legalPhone],
    ["Responsable de publication", publicationDirector], ["Nom de l'hébergeur", hostingName],
    ["Adresse de l'hébergeur", hostingAddress], ["Téléphone de l'hébergeur", hostingPhone],
    ["Identité du prestataire de stockage", storageLegalName], ["Adresse du prestataire de stockage", storageLegalAddress]
  ];
  const missingLegalFields = fields.filter(([, value]) => isUnfilled(value)).map(([label]) => label);
  const emailPattern = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;
  if (!emailPattern.test(supportEmail) && !missingLegalFields.includes(fields[0][0])) missingLegalFields.push(fields[0][0]);
  if (!emailPattern.test(privacyEmail) && !missingLegalFields.includes(fields[1][0])) missingLegalFields.push(fields[1][0]);

  return {
    appName: "Prépatempo",
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
    hostingPhone,
    storageLegalName,
    storageLegalAddress,
    missingLegalFields,
    isIncomplete: missingLegalFields.length > 0
  };
}
