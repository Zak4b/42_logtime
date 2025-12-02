# 42 Logtime Monitor

Application de monitoring du logtime 42 avec notifications push

## 🚀 Installation

### Docker (recommandé)

```bash
docker run -d \
  --name 42_logtime \
  --restart unless-stopped \
  -p 9655:9655 \
  --env-file .env \
  ghcr.io/zak4b/42_logtime:latest
```

### Local

```bash
npm install
npm start
```

## 📋 Configuration

Créez un fichier `.env` avec :

```env
CLIENT_ID=votre_client_id
CLIENT_SECRET=votre_client_secret
USER_LOGIN=votre_login

# Optionnel
NTFY_TOPIC=mon-topic-ntfy
NTFY_PASSWORD=mot-de-passe-optionnel
PORT=9655
```

## 🎯 Utilisation

### Mode Shell (interactif)

```bash
npm start [login]
```

### Mode Serveur (API REST)

```bash
npm run server
```

L'API est disponible sur `http://localhost:9655`

## 📱 Notifications Push

L'application utilise **ntfy.sh** pour envoyer des notifications sur votre téléphone.

1. **Installer l'app ntfy** sur votre téléphone (iOS/Android)
2. **Créer un topic** dans l'app (ex: `mon-logtime-123`)
3. **Ajouter dans `.env`** :

```env
NTFY_TOPIC=mon-logtime-123
NTFY_PASSWORD=optionnel-pour-securiser
```

## 🔧 Variables d'environnement

### Requises

- `CLIENT_ID` : ID client de l'API 42
- `CLIENT_SECRET` : Secret client de l'API 42
- `USER_LOGIN` : Login de l'utilisateur à monitorer

### Optionnelles

- `NTFY_TOPIC` : Topic pour les notifications push
- `NTFY_PASSWORD` : Mot de passe pour sécuriser le topic ntfy
- `PORT` : Port du serveur HTTP (défaut: 9655)
