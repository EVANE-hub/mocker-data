# 🚀 Zerve Mock Server

Serveur Node.js de mock API basé sur la spécification OpenAPI et le schéma SQL de Zerve.

## 📋 Description

Ce serveur fournit des données mockées statiques pour tous les endpoints de l'API Zerve, permettant le développement frontend sans dépendre du backend réel.

## 🏗️ Structure du projet

```
├── package.json              # Dépendances et scripts
├── server.js                 # Serveur Express principal
├── zerve-openapi.yaml       # Spécification OpenAPI 3.0
├── Zerve.sql                # Schéma de base de données PostgreSQL
├── mock-data/               # Fichiers JSON de données mockées
│   ├── auth_ping.json
│   ├── users_me.json
│   ├── nightclubs.json
│   ├── nightclubs__id.json
│   ├── nightclubs__id_tables.json
│   ├── nightclubs__id_products.json
│   ├── reservations.json
│   ├── orders.json
│   └── ...
└── README.md
```

## 🚀 Installation

```bash
npm install
```

## ▶️ Démarrage

```bash
npm start
```

Le serveur démarre par défaut sur **http://localhost:3000**

## 📚 Documentation

### Swagger UI (Interface interactive)

Une fois le serveur lancé, accédez à la documentation Swagger :

👉 **http://localhost:3000/api-docs**

L'interface Swagger UI vous permet de :

- 📖 Visualiser tous les endpoints disponibles
- 🔍 Explorer les schémas de données
- 🧪 Tester les endpoints directement depuis le navigateur
- 📝 Voir les exemples de requêtes et réponses

### Health Check

```
GET http://localhost:3000/health
```

## 🎯 Endpoints principaux

### Authentification

- `GET /auth/ping` - Vérifier l'accès API

### Utilisateurs

- `GET /users/me` - Profil utilisateur connecté
- `PUT /users/me` - Mettre à jour le profil
- `GET /users/{id}` - Obtenir un utilisateur par ID
- `DELETE /users/{id}` - Supprimer un utilisateur

### Établissements (Nightclubs)

- `GET /nightclubs` - Liste des établissements
- `POST /nightclubs` - Créer un établissement
- `GET /nightclubs/{id}` - Détails d'un établissement
- `PUT /nightclubs/{id}` - Mettre à jour un établissement
- `DELETE /nightclubs/{id}` - Supprimer un établissement
- `GET /nightclubs/{id}/rules` - Règles de réservation
- `GET /nightclubs/{id}/hours` - Horaires d'ouverture

### Tables

- `GET /nightclubs/{id}/tables` - Liste des tables d'un club
- `POST /nightclubs/{id}/tables` - Ajouter une table
- `GET /tables/{id}` - Détail d'une table
- `PUT /tables/{id}` - Mettre à jour une table
- `DELETE /tables/{id}` - Supprimer une table

### Produits

- `GET /nightclubs/{id}/categories` - Liste des catégories
- `GET /nightclubs/{id}/products` - Liste des produits
- `GET /products/{productId}` - Détail d'un produit
- `PUT /products/{productId}` - Mettre à jour un produit
- `DELETE /products/{productId}` - Supprimer un produit

### Réservations

- `GET /reservations` - Liste des réservations
- `POST /reservations` - Créer une réservation
- `GET /reservations/{id}` - Détail d'une réservation
- `PUT /reservations/{id}` - Mettre à jour une réservation
- `DELETE /reservations/{id}` - Supprimer une réservation
- `PUT /reservations/{id}/status` - Mettre à jour le statut
- `GET /reservations/{id}/guests` - Liste des invités
- `POST /reservations/{id}/guests` - Ajouter un invité
- `GET /reservations/{id}/items` - Articles de la réservation
- `POST /reservations/{id}/items` - Ajouter un article

### Commandes (QR Code)

- `POST /orders` - Créer une commande
- `GET /orders/{id}` - Détail d'une commande
- `GET /tables/{id}/orders` - Commandes d'une table

### Paiements

- `POST /payments` - Créer un paiement
- `GET /payments/{id}` - Détail d'un paiement
- `GET /reservations/{id}/payments` - Paiements d'une réservation

### Notifications

- `GET /notifications` - Liste des notifications
- `PUT /notifications/{id}/read` - Marquer comme lu

### Dashboard (Back-office)

- `GET /dashboard/reservations` - Réservations dashboard
- `GET /dashboard/orders` - Commandes dashboard

## 📁 Format des données mockées

Les données sont organisées par endpoint. Le nom du fichier correspond au chemin de l'endpoint :

| Endpoint                      | Fichier Mock                 |
| ----------------------------- | ---------------------------- |
| `GET /auth/ping`              | `auth_ping.json`             |
| `GET /users/me`               | `users_me.json`              |
| `GET /nightclubs`             | `nightclubs.json`            |
| `GET /nightclubs/{id}`        | `nightclubs__id.json`        |
| `GET /nightclubs/{id}/tables` | `nightclubs__id_tables.json` |

### Convention de nommage

- `/` → `_`
- `{id}` → `_id`
- `{productId}` → `_productId`

## 🔧 Configuration

### Port personnalisé

```bash
PORT=4000 npm start
```

### Modifier les données mockées

Éditez simplement les fichiers JSON dans le dossier `mock-data/` et redémarrez le serveur.

## 💡 Exemples d'utilisation

### Avec curl

```bash
# Liste des établissements
curl http://localhost:3000/nightclubs

# Détail d'un établissement
curl http://localhost:3000/nightclubs/1

# Tables d'un établissement
curl http://localhost:3000/nightclubs/1/tables

# Profil utilisateur
curl http://localhost:3000/users/me
```

### Avec JavaScript (fetch)

```javascript
// Récupérer les établissements
const response = await fetch("http://localhost:3000/nightclubs");
const data = await response.json();
console.log(data);

// Créer une réservation
const reservation = await fetch("http://localhost:3000/reservations", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    nightclub_id: 1,
    table_id: 2,
    date: "2025-10-20",
    arrival_time: "23:00:00",
    guest_count: 6,
  }),
});
```

## 📊 Données incluses

Le serveur contient des données mockées réalistes pour :

- **3 établissements** (Le Moonlight, Club Sensation, La Fabrik)
- **5 tables** avec différentes capacités et prix
- **4 catégories de produits** (Champagnes, Spiritueux, Cocktails, Softs)
- **8 produits** avec prix en centimes
- **3 réservations** avec différents statuts
- **4 invités** avec statuts variés
- **2 commandes** en préparation et servies
- **Paiements et notifications**

## 🛠️ Technologies utilisées

- **Express.js** - Framework web
- **Swagger UI Express** - Documentation interactive
- **YAML.js** - Parsing de la spécification OpenAPI
- **CORS** - Support cross-origin
- **Body Parser** - Parsing JSON

## 📝 Notes

- Toutes les méthodes **DELETE** retournent un statut `204 No Content`
- Les méthodes **POST** retournent un statut `201 Created`
- Les montants sont en **centimes** (ex: 50000 = 500.00€)
- Les dates sont au format **ISO 8601**
- Le serveur gère automatiquement tous les endpoints définis dans `zerve-openapi.yaml`

## 🎨 Fonctionnalités

✅ Support complet de la spécification OpenAPI 3.0  
✅ Documentation Swagger UI interactive  
✅ CORS activé pour le développement frontend  
✅ Données mockées réalistes et cohérentes avec le schéma SQL  
✅ Gestion automatique de tous les endpoints  
✅ Logs détaillés des requêtes  
✅ Réponses adaptées selon la méthode HTTP

## 🔗 Liens utiles

- [OpenAPI Specification](https://swagger.io/specification/)
- [Express.js Documentation](https://expressjs.com/)
- [Swagger UI](https://swagger.io/tools/swagger-ui/)

---

**Développé pour le MVP Zerve** 🎉
