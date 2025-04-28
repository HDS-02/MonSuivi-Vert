FROM node:20-alpine AS build

WORKDIR /app

# Copier les fichiers de configuration
COPY package*.json ./
COPY tsconfig.json ./
COPY vite.config.ts ./
COPY tailwind.config.ts ./
COPY postcss.config.js ./
COPY drizzle.config.ts ./
COPY components.json ./
COPY bolt.json ./

# Installer les dépendances
RUN npm install

# Copier le reste du code source
COPY . .

# Construire l'application
RUN npm run build

# Configuration de production
FROM node:20-alpine

WORKDIR /app

# Copier les fichiers nécessaires depuis l'étape de build
COPY --from=build /app/package*.json ./
COPY --from=build /app/dist ./dist
COPY --from=build /app/bolt.json ./

# Installer uniquement les dépendances de production
RUN npm ci --only=production

# Définir les variables d'environnement par défaut
ENV NODE_ENV=production
ENV PORT=5000

# Exposer le port
EXPOSE 5000

# Commande de démarrage
CMD ["node", "dist/index.js"]