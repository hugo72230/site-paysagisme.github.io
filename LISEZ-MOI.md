# Site de paysagisme — Hugo & Mathéo

Site statique prêt à publier sur GitHub Pages, avec formulaire de demande de rendez-vous et tableau de gestion connecté à Supabase.

## Fichiers

- `index.html` : accueil et prestations.
- `entreprises.html` : présentation séparée des entreprises Hugo et Mathéo.
- `rendez-vous.html` : formulaire public de demande de rendez-vous.
- `gestion.html` : connexion et tableau de bord privé pour traiter les demandes.
- `style.css` : design responsive.
- `js/config.js` : configuration du projet Supabase.
- `js/booking.js` et `js/gestion.js` : fonctionnalités du formulaire et du tableau de bord.
- `supabase.sql` : tables, droits et règles de sécurité RLS.

## Étape 1 — Créer le projet Supabase

1. Créez un projet sur https://supabase.com/ si vous n'en avez pas déjà un.
2. Dans le projet, ouvrez **SQL Editor**, créez une requête, copiez tout le contenu de `supabase.sql`, puis exécutez-le.
3. Ouvrez **Project Settings / API** (ou **Connect**) et copiez l'URL du projet ainsi que la clé publique **publishable** (ou la clé `anon` historique).
4. Ouvrez `js/config.js` et remplacez les deux valeurs de démonstration par votre URL et votre clé publique.

**Ne mettez jamais la clé `service_role` ou une clé secrète dans `js/config.js` ni dans GitHub.** Le fichier de configuration est visible publiquement.

## Étape 2 — Créer les comptes administrateurs

1. Dans Supabase, ouvrez **Authentication → Users** et créez un utilisateur pour Hugo et un pour Mathéo. Désactivez les inscriptions publiques si elles sont activées dans les paramètres Auth. Le site n'a aucun bouton d'inscription.
2. Copiez l'UUID de chaque utilisateur créé.
3. Dans **SQL Editor**, exécutez une commande par utilisateur, en remplaçant l'UUID :

```sql
insert into public.site_admins (user_id)
values ('UUID-DE-L-UTILISATEUR');
```

Seuls les comptes dont l'UUID est présent dans `site_admins` peuvent lire, modifier ou supprimer les demandes. La sécurité est vérifiée par Supabase, pas seulement par l'interface du site.

## Étape 3 — Tester avant publication

1. Publiez les fichiers sur GitHub ou lancez-les avec un petit serveur local. Évitez d'ouvrir directement les pages en `file://` : certains navigateurs bloquent des fonctionnalités dans ce mode.
2. Envoyez une demande test depuis `rendez-vous.html`.
3. Ouvrez `gestion.html`, connectez-vous avec un compte autorisé et vérifiez que la demande apparaît.
4. Testez le changement de statut et la suppression. Vérifiez aussi qu'une session non autorisée ne peut pas lire les demandes.

## Étape 4 — Publier sur GitHub Pages

1. Créez un dépôt GitHub et ajoutez les fichiers du dossier à la racine du dépôt (pas seulement le ZIP).
2. Dans **Settings → Pages**, sélectionnez le déploiement depuis la branche principale (`main`) et le dossier `/ (root)`.
3. Attendez que GitHub Pages publie le site. Les URL seront de la forme `https://VOTRE-NOM.github.io/NOM-DU-DEPOT/`.
4. Dans Supabase, vérifiez les réglages Auth / URL Configuration et ajoutez l'URL du site si nécessaire. Le formulaire public n'a pas besoin de connexion ; l'espace gestion se connecte par e-mail et mot de passe.

## À compléter avant la mise en ligne publique

- Zone géographique desservie, coordonnées professionnelles, e-mail et téléphone de chaque entreprise.
- Informations légales obligatoires (identité légale, SIRET dès obtention, mentions légales et politique de confidentialité).
- Préciser qui reçoit chaque demande quand le client choisit « Peu importe ».
- Tester le formulaire, les règles RLS et la connexion depuis l'URL publique.

## Fonctionnement du rendez-vous

Le formulaire crée une demande au statut `pending` (« En attente »). Il ne réserve pas automatiquement un créneau et n'envoie pas encore d'e-mail automatique : la confirmation se fait manuellement après que vous avez recontacté le client. Vous pouvez passer le statut à Acceptée, Refusée ou Terminée dans le tableau de bord.

## Confidentialité et sécurité

Le formulaire transmet les données de contact au projet Supabase que vous configurez. Les administrateurs peuvent voir ces données après connexion. N'ajoutez pas de clé secrète au site public. Protégez les comptes administrateurs avec des mots de passe uniques et activez la protection supplémentaire proposée par Supabase si disponible. Pour un usage réel, vérifiez la conformité RGPD, la politique de conservation des demandes et les règles applicables à votre activité.
