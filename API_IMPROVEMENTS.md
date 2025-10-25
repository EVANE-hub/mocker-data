# 📝 Améliorations API Zerve - Version 2.0

## Résumé des modifications

Ce document décrit toutes les améliorations apportées aux APIs selon vos commentaires.

---

## 🆕 Nouvelles APIs

### 1. `GET /friends`

Liste de tous les amis (en attente & validés)

**Réponse:**

```json
{
  "data": [
    {
      "id": 1,
      "user_id": 5,
      "firstname": "Lucas",
      "lastname": "Petit",
      "email": "lucas.petit@example.com",
      "profile_image": "https://i.pravatar.cc/150?img=12",
      "gender": "male",
      "status": "accepted", // ou "pending"
      "since": "2025-03-15T10:00:00Z",
      "common_outings": 12,
      "last_outing": "2025-10-05T23:00:00Z"
    }
  ],
  "total": 5,
  "accepted": 3,
  "pending": 2
}
```

---

## 🏢 Améliorations `/nightclubs`

### API Liste vs Détail

#### `GET /nightclubs` - Version Liste (allégée)

```json
{
  "data": [
    {
      "id": 1,
      "name": "Le Moonlight",
      "city": "Paris",
      "image": "https://images.unsplash.com/...",
      "music_types": ["Électro", "House", "Techno"],
      "total_tables": 15,
      "rating": 4.5
    }
  ],
  "total": 3
}
```

**Nouveaux champs ajoutés:**

- ✅ `image` - string (URL de l'image principale)
- ✅ `music_types` - string[] (types de musique)
- ✅ `total_tables` - number (nombre de tables)
- ✅ `rating` - number (note moyenne)

#### `GET /nightclubs/{id}` - Version Détaillée

```json
{
  "id": 1,
  "owner_id": 2,
  "name": "Le Moonlight",
  "description": "Description complète...",
  "image": "https://images.unsplash.com/...",
  "music_types": ["Électro", "House", "Techno"],
  "address": "15 Rue de Rivoli",
  "city": "Paris",
  "country": "France",
  "latitude": 48.856614,
  "longitude": 2.352222,
  "phone": "+33142345678",
  "website": "https://lemoonlight.fr",
  "email": "contact@lemoonlight.fr",
  "total_tables": 15,
  "rating": 4.5,
  "total_reviews": 248,
  "price_range": "€€€",
  "dress_code": "Élégant",
  "min_age": 21,
  "capacity": 500,
  "features": ["Bar", "VIP", "Terrasse", "Vestiaire", "Fumoir"],
  "social_media": {
    "instagram": "@lemoonlight",
    "facebook": "lemoonlightparis",
    "tiktok": "@lemoonlight"
  },
  "created_at": "2025-01-15T10:00:00Z",
  "updated_at": "2025-10-10T15:30:00Z"
}
```

### Notes

- **Pagination**: À implémenter plus tard avec `?page=1&limit=10`
- La version liste est optimisée pour l'affichage en grille/carte
- La version détail contient toutes les informations nécessaires à la page de détail

---

## 🎟️ Améliorations `/reservations`

### Statuts possibles

```typescript
enum ReservationStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  PAST = "past",
  CANCELLED = "cancelled",
  TO_FINALIZE = "to_finalize",
  IN_PROGRESS = "in_progress",
}
```

✅ **Confirmé** - Tous ces statuts sont maintenant supportés

### API Liste vs Détail

#### `GET /reservations` - Version Liste (allégée)

```json
{
  "data": [
    {
      "id": 1,
      "title": "Anniversaire Sophie 🎉",
      "nightclub_id": 1,
      "nightclub_name": "Le Moonlight",
      "nightclub_image": "https://images.unsplash.com/...",
      "table_number": 2,
      "date": "2025-10-28",
      "arrival_time": "23:30:00",
      "guest_count": 6,
      "male_count": 3,
      "female_count": 2,
      "other_count": 1,
      "amount": 65000,
      "status": "confirmed"
    }
  ],
  "total": 4
}
```

**Nouveaux champs ajoutés:**

- ✅ `title` - string (titre de la réservation)
- ✅ `nightclub_name` - string (nom du club)
- ✅ `nightclub_image` - string (image du club)
- ✅ `other_count` - number (personnes ni homme ni femme)
- ✅ `table_number` - number (numéro de table)

#### `GET /reservations/{id}` - Version Détaillée

```json
{
  "id": 1,
  "title": "Anniversaire Sophie 🎉",
  "nightclub_id": 1,
  "nightclub_name": "Le Moonlight",
  "nightclub_image": "https://images.unsplash.com/...",
  "nightclub_address": "15 Rue de Rivoli, Paris",
  "user_id": 1,
  "table_id": 2,
  "table_number": 2,
  "table_capacity": 6,
  "date": "2025-10-28",
  "arrival_time": "23:30:00",
  "guest_count": 6,
  "male_count": 3,
  "female_count": 2,
  "other_count": 1,
  "amount": 65000,
  "amount_paid": 10833,
  "amount_remaining": 54167,
  "status": "confirmed",
  "note": "Anniversaire - prévoir bougies et champagne frappé",
  "qr_code": "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=ZERVE-RES-1",
  "guests": [
    {
      "id": 1,
      "user_id": 5,
      "name": "Lucas Petit",
      "status": "accepted",
      "amount_due": 10833,
      "amount_paid": 10833
    }
  ],
  "items": [
    {
      "id": 1,
      "product_id": 2,
      "product_name": "Moët & Chandon Imperial",
      "quantity": 2,
      "unit_price": 25000,
      "total_price": 50000
    }
  ],
  "created_at": "2025-10-12T15:30:00Z",
  "updated_at": "2025-10-13T09:00:00Z"
}
```

**Champs supplémentaires en version détail:**

- `nightclub_address` - Adresse complète
- `table_capacity` - Capacité de la table
- `amount_paid` / `amount_remaining` - Détail des paiements
- `note` - Note complète
- `qr_code` - QR code de la réservation
- `guests[]` - Liste complète des invités
- `items[]` - Liste des produits commandés

### Format des dates

Les dates utilisent le format **ISO 8601** qui est compatible avec Moment.js :

- `date`: `"2025-10-28"` (YYYY-MM-DD)
- `arrival_time`: `"23:30:00"` (HH:mm:ss)
- `created_at`, `updated_at`: `"2025-10-13T09:00:00Z"` (ISO 8601 avec timezone)

---

## 👤 Améliorations `/users/me`

### Genre du user

```typescript
enum Gender {
  FEMALE = "female",
  MALE = "male",
  OTHER = "other",
}
```

✅ **Confirmé** - Seules ces 3 valeurs sont possibles

### Nouveaux champs

```json
{
  "id": 1,
  "firstname": "Sophie",
  "lastname": "Martin",
  "email": "sophie.martin@example.com",
  "tel": "+33612345678",
  "gender": "female",
  "birthdate": "1995-03-15",
  "profile_image": "https://i.pravatar.cc/150?img=47",
  "music_preferences": ["Électro", "House", "Techno", "Deep House"],
  "nightclubs": [
    {
      "id": 1,
      "name": "Le Moonlight",
      "image": "https://images.unsplash.com/...",
      "nb_outings": 12
    }
  ],
  "total_outings": 25,
  "created_at": "2025-01-10T10:00:00Z",
  "updated_at": "2025-10-25T09:00:00Z"
}
```

**Nouveaux champs ajoutés:**

- ✅ `music_preferences` - string[] (préférences musicales)
- ✅ `nightclubs` - array d'objets avec `{id, name, image, nb_outings}`
- ✅ `total_outings` - number (total de sorties)

**Champs retirés:**

- ❌ `role_id` et `role` - Supprimés (séparation clients/employés à venir)

### Note sur les rôles

Le rôle a été retiré de l'API client. Une API séparée sera créée pour les professionnels (employés/gérants) avec leurs rôles spécifiques.

---

## 📊 Récapitulatif des URLs

| Méthode | Endpoint             | Type   | Description                      |
| ------- | -------------------- | ------ | -------------------------------- |
| GET     | `/nightclubs`        | Liste  | Liste allégée des clubs          |
| GET     | `/nightclubs/{id}`   | Détail | Détail complet d'un club         |
| GET     | `/reservations`      | Liste  | Liste allégée des réservations   |
| GET     | `/reservations/{id}` | Détail | Détail complet d'une réservation |
| GET     | `/users/me`          | Détail | Profil utilisateur enrichi       |
| GET     | `/friends`           | Liste  | Liste des amis                   |

---

## 🎨 Images utilisées

Toutes les images utilisent des URLs de services gratuits :

- **Unsplash** - Photos de clubs/ambiance
- **Pravatar** - Photos de profil utilisateurs
- **QR Server** - Génération de QR codes

---

## ✅ Checklist des modifications

- [x] API `/friends` créée
- [x] `/nightclubs` - Version liste allégée
- [x] `/nightclubs/{id}` - Version détail complète
- [x] Ajout `image`, `music_types`, `total_tables`
- [x] `/reservations` - Version liste allégée
- [x] `/reservations/{id}` - Version détail complète
- [x] Ajout `title`, `nightclub_name`, `nightclub_image`, `other_count`
- [x] Statuts de réservation validés
- [x] `/users/me` - Enrichi avec préférences et historique
- [x] Genre limité à `female`, `male`, `other`
- [x] Ajout `music_preferences` et `nightclubs[]`
- [x] Suppression du rôle dans l'API client

---

## 🚀 Test des nouvelles APIs

```bash
# Liste des clubs (allégée)
curl http://localhost:3002/nightclubs

# Détail d'un club
curl http://localhost:3002/nightclubs/1

# Liste des réservations (allégée)
curl http://localhost:3002/reservations

# Détail d'une réservation
curl http://localhost:3002/reservations/1

# Profil utilisateur enrichi
curl http://localhost:3002/users/me

# Liste des amis
curl http://localhost:3002/friends
```

---

## 📌 À implémenter plus tard

1. **Pagination** sur `/nightclubs` et `/reservations`
   - Paramètres: `?page=1&limit=10`
2. **Filtres** sur les listes

   - `/nightclubs?city=Paris&music_type=Techno`
   - `/reservations?status=confirmed&date_from=2025-10-01`

3. **API Professionnels** séparée
   - Endpoints distincts pour les gérants/employés
   - Gestion des rôles (manager, staff, admin)

---

**Version:** 2.0  
**Date:** 25 octobre 2025  
**Auteur:** Équipe Zerve
