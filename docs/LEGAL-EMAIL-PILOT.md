# Mentions legales et recuperation de compte

## Informations confirmees le 13 novembre 2026

- Nom public : Prepatempo.
- Editeur et responsable de publication : Clement Peyranne.
- Projet personnel, sans entreprise immatriculee.
- Pilote gratuit, sur invitation, sans vente, abonnement ni publicite.
- Contact support et donnees personnelles : prepacoach7@gmail.com (publication autorisee).

Ces informations sont des faits confirmes par le porteur du projet, pas une certification juridique.
Ne pas renseigner un SIREN fictif ni qualifier automatiquement le site de non professionnel.

## Informations encore necessaires

Verifier que l'hebergeur detient bien l'identite et les coordonnees completes de l'editeur.
Le regime de l'article 1-1 II de la LCEN est reserve aux editeurs non professionnels,
sous cette condition. Le pilote gratuit ne suffit pas, a lui seul, a qualifier le projet.
En attendant cette verification et le choix du regime applicable, conserver l'avertissement
de mentions incompletes. Ne pas publier l'adresse personnelle ni le telephone sans choix
explicite de l'editeur. Si le regime general s'applique, completer ces coordonnees via les
variables de production et faire relire les mentions avant ouverture publique.

Les informations sur l'hebergement et le stockage doivent correspondre aux prestataires
contractuels reels. Le controle automatique de configuration n'est pas une validation juridique.
L'adresse Vercel a ete verifiee dans sa notice officielle. Son numero de telephone reste a confirmer,
sans le remplacer par un numero trouve sur un annuaire tiers.
Le prestataire Supabase indique par defaut correspond a une souscription directe (hors AWS Marketplace) ;
verifier le contrat du compte et adapter `NEXT_PUBLIC_STORAGE_LEGAL_NAME` et
`NEXT_PUBLIC_STORAGE_LEGAL_ADDRESS` si necessaire.

## Activer les emails, sans partager de secret dans le chat

1. Acheter un domaine choisi et confirme par le porteur du projet. Aucun achat automatique.
2. Creer un compte Resend et y ajouter un sous-domaine d'envoi, par exemple `notifications.domaine.fr`.
3. Ajouter les enregistrements DNS demandes par Resend, sans supprimer les enregistrements existants.
4. Attendre le statut `Verified`. Desactiver le suivi des ouvertures et des clics sur ce domaine.
5. Creer une cle `Sending access` limitee au domaine d'envoi.
6. Dans Vercel, en production, renseigner `RESEND_API_KEY` (secret), `EMAIL_FROM` (adresse seule du domaine),
   `NEXT_PUBLIC_APP_URL` (URL HTTPS du site) et `PASSWORD_RESET_MODE=email`.
7. Renseigner facultativement `RESEND_DOMAIN_ID` pour le diagnostic. Une cle limitee a l'envoi peut
   refuser sa lecture : verifier alors le domaine dans Resend, sans augmenter les droits de la cle du site.
8. Redeployer le site. Ne jamais donner de prefixe `NEXT_PUBLIC_` a une cle secrete.

Le site peut conserver son URL `vercel.app` : le domaine possede peut servir uniquement a l'envoi.
L'adresse Gmail reste utilisable pour recevoir les demandes de support, pas comme expediteur Resend.
Le domaine `resend.dev` ne permet pas l'envoi aux eleves : il est reserve aux essais vers son propre compte.

## Verification reelle

`npm run email:check:prod` controle la configuration locale de production et, si possible, le domaine.
Il ne modifie aucun compte et n'envoie aucun email. Il ne prouve pas que Vercel a les memes variables.
Une sortie 1 signale un blocage ; une sortie 2 signifie qu'une verification manuelle reste necessaire.

Apres deploiement, utiliser un compte test controle par l'editeur :

1. Demander la recuperation depuis le site en ligne et verifier la reception (y compris les indesirables).
2. Ouvrir le lien, choisir un nouveau mot de passe et se reconnecter.
3. Verifier que l'ancien mot de passe et le lien deja utilise sont refuses.
4. Verifier que la reponse affichee est identique pour une adresse inconnue, sans lien visible dans le site.

Ne pas annoncer la recuperation operationnelle avant cette recette. Les tests automatises simulent
le prestataire : ils ne prouvent ni la verification DNS ni la livraison reelle.

## Sources officielles

- LCEN, article 1-1 : https://www.legifrance.gouv.fr/loda/article_lc/LEGIARTI000049568614/
- Information RGPD : https://www.cnil.fr/fr/passer-laction/rgpd-les-premieres-etapes
- Domaines Resend : https://resend.com/docs/dashboard/domains/introduction
- Domaine de test Resend : https://resend.com/docs/knowledge-base/403-error-resend-dev-domain
- Vercel : https://vercel.com/legal/privacy-notice
- Entite contractante Supabase : https://supabase.com/terms
