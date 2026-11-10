# 🔴🟡 Puissance 4 en Ligne (Multijoueur sans compte)

Un jeu de **Puissance 4** multijoueur en temps réel, jouable directement dans le navigateur sans création de compte ni inscription.

## 🚀 Fonctionnalités

- **Lien Magique Instantané** : Cliquez sur "Créer une partie en ligne", copiez le lien généré et envoyez-le à votre ami (par WhatsApp, Messenger, Discord, email, SMS, etc.). Dès qu'il ouvre le lien, la partie démarre immédiatement !
- **Multijoueur Temps Réel P2P (WebRTC via PeerJS)** : Connexion directe ultra-rapide sans latence serveur ni base de données payante.
- **Réactions Emojis en direct** : Envoyez des réactions animées (🔥, 😂, 👏, 😱, 🎯, 💀) qui s'affichent en direct sur l'écran de votre adversaire.
- **Modes Alternatifs** :
  - 👥 **2 Joueurs Local** : Pour jouer sur le même écran d'ordinateur ou de téléphone.
  - 🤖 **Mode Solo contre l'IA** : Pour s'entraîner avec l'algorithme Minimax.
- **Design Soigné & Tactile** : Plateau réaliste, chutes de jetons animées avec rebond physique, surlignage des 4 jetons gagnants.
- **Effets Sonores Intégrés** : Synthétiseur Web Audio API (chute du jeton, fanfare de victoire, connexion de l'adversaire).
- **100 % Responsive** : Parfaitement adapté aux mobiles, tablettes et ordinateurs.

---

## ⚡ Déploiement sur Vercel (Gratuit)

Ce projet est 100 % statique et optimisé pour le plan **Hobby (Gratuit)** de Vercel.

### Option 1 : Via GitHub (Automatique)
1. Poussez ce dépôt sur votre compte GitHub (`guigui-guigs/puissance4-online`).
2. Rendez-vous sur [vercel.com/new](https://vercel.com/new).
3. Cliquez sur **"Import"** en face du dépôt `puissance4-online`.
4. Cliquez sur **"Deploy"**. En 10 secondes, votre jeu est en ligne avec une URL `.vercel.app` sécurisée HTTPS !

### Option 2 : Via Vercel CLI
```bash
npx vercel --prod
```

---

## 🛠️ Technologies
- **HTML5 & CSS3** (Vanilla, design moderne sans framework lourd)
- **JavaScript ES Modules**
- **PeerJS / WebRTC** pour la synchronisation multijoueur P2P en temps réel
- **Web Audio API** pour les effets sonores natifs sans fichiers audio externes
