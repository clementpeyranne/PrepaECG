function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!);
}

export function createRecoveryEmail(link: string) {
  const href = escapeHtml(link);
  return {
    text: `Pour choisir un nouveau mot de passe, ouvre ce lien :\n\n${link}\n\nCe lien est valable une heure et ne peut servir qu'une fois.\nSi tu n'as pas demandé ce changement, ignore cet email. Ton mot de passe reste inchangé.\n\nPrépatempo ne te demandera jamais ton mot de passe par email.`,
    html: `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#f7f1e7;color:#14221d;font-family:Arial,sans-serif">
<table role="presentation" style="width:100%;border-collapse:collapse"><tr><td style="padding:32px 16px">
<table role="presentation" style="width:100%;max-width:560px;margin:auto;border-collapse:collapse;background:#ffffff;border-radius:20px"><tr><td style="padding:32px">
<p style="margin:0 0 24px;font-size:18px;font-weight:bold">Prépatempo</p>
<h1 style="margin:0 0 20px;font-size:26px;line-height:1.3">Choisir un nouveau mot de passe</h1>
<p style="line-height:1.7">Tu as demandé à réinitialiser ton mot de passe. Utilise le bouton ci-dessous pour en choisir un nouveau.</p>
<p style="margin:28px 0"><a href="${href}" style="display:inline-block;padding:14px 22px;border-radius:24px;background:#14221d;color:#ffffff;text-decoration:none;font-weight:bold">Réinitialiser le mot de passe</a></p>
<p style="line-height:1.7">Ce lien est valable <strong>une heure</strong> et ne peut servir qu'une fois. Sans demande de ta part, ignore cet email : ton mot de passe reste inchangé.</p>
<p style="font-size:13px;line-height:1.7;color:#496057">Si le bouton ne fonctionne pas, ouvre ce lien dans ton navigateur :<br><a href="${href}" style="color:#14221d;word-break:break-all">${href}</a></p>
<p style="margin-top:28px;font-size:12px;line-height:1.7;color:#496057">Prépatempo ne te demandera jamais ton mot de passe par email.</p>
</td></tr></table></td></tr></table></body></html>`
  };
}
