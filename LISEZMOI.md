# Agora 340 : fiches d'étude et quiz pour le Test de compréhension 1 (Philosophie et rationalité, 340-101-MQ)

Fait le 14 septembre 2026 à partir des 8 PDF du dossier `Grasset Session 1\Philo`
(Cours 1, 2, 3, 4, 5, 7, Socrate_et_les_sophistes, Guide_de_revision).

## Ouvrir
- Double-cliquer sur `agora-340.html` : ça marche sans Internet sauf pour les polices (Google Fonts).
- **En ligne, sans compte** : https://vaelordesign.github.io/agora-340/ (dépôt public `vaelordesign/agora-340`, GitHub Pages servi depuis `docs/`; page en noindex, donc pas dans Google).
- Ou la version Artifact (privée) : https://claude.ai/artifact/Q5yBEDB5cAfJLYDPLvAPW4
- La progression (fiches cochées, questions ratées, examens blancs) reste dans le navigateur (localStorage, clé `agora-340`). Aucun compte, aucun serveur.

## Ce qu'il y a dedans
- **Fiches** : 20 fiches qui couvrent les 22 thèmes du guide de révision, avec définitions, tableaux comparatifs, pièges d'examen et plans modèles pour les questions de réflexion. Les encadrés « Complément » signalent ce qui ne vient PAS des diapos.
- **Quiz** : 236 questions (127 choix multiples, 51 vrai ou faux, 48 réponses courtes auto-évaluées, 10 développements avec plan modèle), filtrables par bloc de fiches et par type, mode « Prioriser mes erreurs ».
- **Examen blanc** : 32 questions (18 QCM, 6 V/F, 6 courtes, 2 développements) tirées dans toute la matière, chrono 2 h, correction seulement à la remise.
- **Cartes éclair** : les 48 réponses courtes en cartes à retourner.

## Modifier
Le code est découpé dans `parts/` :
- `a-head.html` : titre, polices, CSS (thème clair et sombre).
- `b-fiches.html` : les 20 fiches (HTML pur, une `<section class="fiche" id="sN">` par fiche).
- `c-views.html` : les coquilles vides des vues quiz, examen, cartes.
- `d-bank.js` : la banque de questions (`BANK`) et les groupes (`GROUPS`). Chaque question a `s` (fiche), `t` (qcm, vf, courte, dev).
- `e-app.js` : le moteur.

Après une modification : `node build.js` régénère `agora-340.html` ET `docs/index.html`; puis `git add -A`, `git commit`, `git push` : GitHub Pages se redéploie seul en une minute. Pour tester en local avec le vrai routage par `#` : `node serve.js` puis http://localhost:8765/ (le lancement `agora` est aussi dans `Typing\.claude\launch.json`).

## Points d'attention
- Le tableau des régimes selon Platon (fiche 8) a été reconstruit à partir d'une diapo dont l'extraction texte était mélangée; les colonnes ont été réalignées par le sens.
- Diapo Protagoras, prémisse 3 : la diapo écrit « les choses ne sont pas ce que nous disons qu'elles sont »; la fiche lit « ne sont que », ce qui correspond au subjectivisme; c'est signalé dans une note.
- Le dialogue d'Euthyphron n'a que des questions dans les diapos : le contenu de la fiche 15 suit le texte de Platon, pas la vidéo vue en classe.
