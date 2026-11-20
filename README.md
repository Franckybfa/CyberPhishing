# Piège ou pas ?

5 jeux pour apprendre à repérer les arnaques par SMS, email, appel et QR code. En français, anglais et arabe.

- **Le Téléphone de Salma** : trier 8 notifications (arnaque ou message légitime).
- **L'Appel piégé** : repérer les manipulations d'un faux conseiller au téléphone.
- **Le Détecteur de liens** : vrai site ou piège ? Glisser à droite ou à gauche.
- **La Chasse aux indices** : trouver les 5 indices cachés dans un faux mail, un faux SMS et une fausse discussion.
- **Le Quiz** : 10 ou 22 questions, des bases aux idées reçues.

## Mettre l'appli en ligne

1. Mettre les fichiers à la racine du dépôt.
2. Dans le dépôt : **Settings → Pages**, puis « Deploy from a branch », branche `main`, dossier `/ (root)`.
3. L'adresse du site s'affiche après une ou deux minutes : `https://<pseudo>.github.io/<nom-du-depot>/`.

On peut aussi ouvrir `index.html` directement dans un navigateur.

## Les fichiers

- `index.html` : la page et son style.
- `app.js` : le fonctionnement des jeux.
- `data.js` : tous les textes (messages, appels, liens, questions) dans les 3 langues.

Les noms et les scores restent dans le navigateur du joueur. Toutes les marques, noms et numéros utilisés dans les jeux sont inventés.
