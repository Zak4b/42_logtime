FROM node:20-alpine

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm ci --only=production

# Copier le code source
COPY src/ ./src/

# Exposer le port (par défaut 9655, peut être changé via PORT env)
EXPOSE 9655

# Commande pour démarrer le serveur
CMD ["npm", "run", "server"]

