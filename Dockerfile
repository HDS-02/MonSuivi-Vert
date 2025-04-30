FROM node:20-alpine

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
RUN npm install @vitejs/plugin-react

# Copier le reste du code
COPY . .

# Construire l'application
RUN npm run build

# Exposer le port
EXPOSE 10000

# Démarrer l'application
CMD ["npm", "run", "start"]