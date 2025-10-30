# Utiliser l'image Node.js officielle
FROM node:20-alpine

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm ci --only=production

# Copier le reste des fichiers de l'application
COPY . .

# Exposer le port 3002
EXPOSE 3002

# Définir la variable d'environnement pour la production
ENV NODE_ENV=production

# Démarrer l'application
CMD ["node", "index.js"]
