# Zerve Mock Server - Docker

## 🚀 Démarrage rapide

### Avec Docker Compose (recommandé)

```bash
# Construire et démarrer le conteneur
docker-compose up -d

# Voir les logs
docker-compose logs -f

# Arrêter le conteneur
docker-compose down
```

### Avec Docker seul

```bash
# Construire l'image
docker build -t zerve-mock-server .

# Démarrer le conteneur
docker run -d -p 3002:3002 --name zerve-mock zerve-mock-server

# Voir les logs
docker logs -f zerve-mock

# Arrêter le conteneur
docker stop zerve-mock
docker rm zerve-mock
```

## 📚 Accéder à la documentation

Une fois le conteneur démarré, accédez à :

- **Swagger UI**: http://localhost:3002

## 🔧 Configuration

Le serveur écoute sur le port **3002** par défaut. Vous pouvez le modifier dans :

- `docker-compose.yml` : ligne `ports`
- Variable d'environnement `PORT`

## 📁 Volumes montés

Le docker-compose monte deux répertoires en lecture seule :

- `./mock-data` : Données mockées (vous pouvez les modifier sans rebuild)
- `./zerve-openapi.yaml` : Spécification OpenAPI

Pour appliquer les modifications, redémarrez simplement le conteneur :

```bash
docker-compose restart
```

## 🛠️ Commandes utiles

```bash
# Reconstruire l'image après modification du code
docker-compose up -d --build

# Voir l'état des conteneurs
docker-compose ps

# Accéder au conteneur
docker-compose exec zerve-mock-api sh

# Nettoyer tout
docker-compose down -v
```
