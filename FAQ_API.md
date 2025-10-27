# ❓ Réponses aux Questions API - Zerve

Ce document répond à toutes les questions posées concernant la structure et le fonctionnement des APIs.

---

## 🏢 Questions sur `/nightclubs`

### Q1: Penser plus tard à une API paginée ?

**Réponse:** ✅ **Oui, absolument recommandé**

**Proposition d'implémentation:**

```typescript
GET /nightclubs?page=1&limit=10&sort=rating&order=desc
```

**Paramètres suggérés:**

- `page` (number, default: 1) - Numéro de page
- `limit` (number, default: 10, max: 50) - Nombre d'éléments par page
- `sort` (string, default: "name") - Champ de tri (name, rating, created_at)
- `order` (string, default: "asc") - Ordre (asc, desc)
- `city` (string, optional) - Filtrer par ville
- `music_type` (string, optional) - Filtrer par type de musique

**Format de réponse paginé:**

```json
{
  "data": [...],
  "pagination": {
    "current_page": 1,
    "total_pages": 5,
    "total_items": 47,
    "items_per_page": 10,
    "has_next": true,
    "has_previous": false
  }
}
```

**APIs à paginer en priorité:**

1. ✅ `/nightclubs` - Liste des clubs
2. ✅ `/reservations` - Liste des réservations
3. ✅ `/friends` - Liste des amis (si > 20 amis)
4. ⚠️ `/nightclubs/{id}/products` - Catalogue produits (si > 50 produits)
5. ⚠️ `/notifications` - Notifications (si > 30 notifications)

**Implémentation recommandée:**

- Pagination par défaut dès le début (limite 10-20 par page)
- Garder la possibilité de tout récupérer avec `?all=true` si besoin
- Ajouter des headers HTTP pour la pagination:
  ```
  X-Total-Count: 47
  X-Page-Count: 5
  Link: <url>; rel="next", <url>; rel="last"
  ```

---

### Q2: API liste vs API détail - séparation des infos ?

**Réponse:** ✅ **Oui, c'est une excellente pratique**

**Avantages de la séparation:**

1. 📉 **Performance** - Moins de données transférées
2. ⚡ **Rapidité** - Chargement plus rapide des listes
3. 💰 **Coût** - Économie de bande passante
4. 🎯 **UX** - Affichage progressif (liste rapide → détail au clic)

**Proposition d'architecture:**

#### Version Liste - `/nightclubs` (allégée)

**Cas d'usage:** Affichage en grille/carte, recherche, filtres

```json
{
  "data": [
    {
      "id": 1,
      "name": "Le Moonlight",
      "city": "Paris",
      "image": "url_image",
      "music_types": ["Électro", "House"],
      "total_tables": 15,
      "rating": 4.5,
      "price_range": "€€€",
      "is_open_tonight": true,
      "min_spend": 50000
    }
  ]
}
```

**Champs minimum pour la liste:**

- ✅ `id` - Identifiant
- ✅ `name` - Nom du club
- ✅ `city` - Ville
- ✅ `image` - Image principale (1 seule)
- ✅ `music_types` - Types de musique (max 3)
- ✅ `total_tables` - Nombre de tables
- ✅ `rating` - Note moyenne
- ✅ `price_range` - Gamme de prix (€, €€, €€€)
- ⭐ `is_open_tonight` - Ouvert ce soir ? (pratique pour le filtre)
- ⭐ `min_spend` - Dépense minimum (pour filtrer)

**Champs optionnels selon le besoin:**

- `distance` - Distance depuis la position de l'utilisateur
- `next_available_date` - Prochaine disponibilité
- `featured` - Club mis en avant
- `promotion` - Promotion en cours

#### Version Détail - `/nightclubs/{id}` (complète)

**Cas d'usage:** Page de détail du club, avant réservation

Tout ce qui est dans la liste + :

- ✅ Description complète
- ✅ Adresse complète + GPS
- ✅ Contact (téléphone, email, website)
- ✅ Horaires d'ouverture détaillés
- ✅ Galerie photos (multiple images)
- ✅ Features complètes (Bar, VIP, Terrasse...)
- ✅ Dress code, âge minimum, capacité
- ✅ Réseaux sociaux
- ✅ Règles de réservation
- ✅ Reviews/Avis détaillés

---

## 🎟️ Questions sur `/reservations`

### Q1: Statuts possibles pour les réservations ?

**Réponse:** ✅ **Statuts validés et implémentés**

```typescript
enum ReservationStatus {
  PENDING = "pending", // En attente de confirmation
  CONFIRMED = "confirmed", // Confirmée par le club
  PAST = "past", // Passée (terminée)
  CANCELLED = "cancelled", // Annulée
  TO_FINALIZE = "to_finalize", // À finaliser (paiement, détails)
  IN_PROGRESS = "in_progress", // En cours (le soir même)
}
```

**Cycle de vie d'une réservation:**

```
1. PENDING (création)
   ↓
2. CONFIRMED (validation club)
   ↓
3. TO_FINALIZE (si paiement incomplet)
   ↓
4. IN_PROGRESS (jour J, à l'arrivée)
   ↓
5. PAST (après la soirée)

[À tout moment] → CANCELLED (annulation)
```

**Règles métier suggérées:**

| Statut        | Peut modifier ? | Peut annuler ?         | Peut payer ? |
| ------------- | --------------- | ---------------------- | ------------ |
| `pending`     | ✅ Oui          | ✅ Oui                 | ✅ Oui       |
| `confirmed`   | ⚠️ Limité       | ✅ Oui (avec pénalité) | ✅ Oui       |
| `to_finalize` | ❌ Non          | ❌ Non                 | ✅ Oui       |
| `in_progress` | ❌ Non          | ❌ Non                 | ✅ Oui       |
| `past`        | ❌ Non          | ❌ Non                 | ❌ Non       |
| `cancelled`   | ❌ Non          | ❌ Non                 | ❌ Non       |

**Filtres utiles pour l'interface:**

```typescript
// Onglets dans l'app
- "À venir" → status IN [pending, confirmed, to_finalize]
- "En cours" → status = in_progress
- "Passées" → status = past
- "Annulées" → status = cancelled
```

---

### Q2: API liste vs API détail pour les réservations ?

**Réponse:** ✅ **Oui, séparation recommandée**

#### Version Liste - `/reservations` (allégée)

**Cas d'usage:** Liste "Mes réservations", historique

```json
{
  "data": [
    {
      "id": 1,
      "title": "Anniversaire Sophie 🎉",
      "nightclub_id": 1,
      "nightclub_name": "Le Moonlight",
      "nightclub_image": "url_image",
      "table_number": 2,
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
      "can_modify": true,
      "can_cancel": true
    }
  ]
}
```

**Champs minimum pour la liste:**

- ✅ `id` - Identifiant
- ✅ `title` - Titre de la réservation
- ✅ `nightclub_name` + `nightclub_image` - Info du club
- ✅ `table_number` - Numéro de table
- ✅ `date` + `arrival_time` - Quand ?
- ✅ `guest_count` - Nombre de personnes
- ✅ `amount` + `amount_paid` + `amount_remaining` - État financier
- ✅ `status` - Statut actuel
- ⭐ `can_modify` / `can_cancel` - Actions possibles (logique métier)

**Pas besoin dans la liste:**

- ❌ Note détaillée
- ❌ Liste complète des invités
- ❌ Liste des produits
- ❌ QR code
- ❌ Infos détaillées du club

#### Version Détail - `/reservations/{id}` (complète)

**Cas d'usage:** Page de détail de la réservation, gestion

Tout ce qui est dans la liste + :

- ✅ `note` - Note complète
- ✅ `nightclub_address` - Adresse du club
- ✅ `table_capacity` - Capacité de la table
- ✅ `qr_code` - QR code pour l'entrée
- ✅ `guests[]` - Liste complète des invités avec statuts
- ✅ `items[]` - Liste des produits/bouteilles commandées
- ✅ `payments[]` - Historique des paiements
- ✅ Timestamps (created_at, updated_at)

---

### Q3: Type de date - Moment ?

**Réponse:** ✅ **Format ISO 8601 - Compatible Moment.js**

**Formats utilisés:**

1. **Date simple** (pour `date`)

   ```json
   "date": "2025-10-28"
   ```

   Format: `YYYY-MM-DD`

   Utilisation Moment.js:

   ```javascript
   moment("2025-10-28").format("DD/MM/YYYY"); // "28/10/2025"
   moment("2025-10-28").format("dddd D MMMM"); // "mardi 28 octobre"
   ```

2. **Heure** (pour `arrival_time`)

   ```json
   "arrival_time": "23:30:00"
   ```

   Format: `HH:mm:ss`

   Utilisation Moment.js:

   ```javascript
   moment("23:30:00", "HH:mm:ss").format("HH:mm"); // "23:30"
   ```

3. **DateTime complet** (pour `created_at`, `updated_at`)

   ```json
   "created_at": "2025-10-13T09:00:00Z"
   ```

   Format: ISO 8601 avec timezone UTC

   Utilisation Moment.js:

   ```javascript
   moment("2025-10-13T09:00:00Z").fromNow(); // "il y a 2 jours"
   moment("2025-10-13T09:00:00Z").format("DD/MM/YYYY à HH:mm");
   ```

**Exemple d'utilisation combinée:**

```javascript
// Créer un datetime complet depuis date + arrival_time
const reservationDateTime = moment(
  `${reservation.date} ${reservation.arrival_time}`,
  "YYYY-MM-DD HH:mm:ss"
);

// Affichage
reservationDateTime.format("dddd D MMMM YYYY à HH:mm");
// "mardi 28 octobre 2025 à 23:30"

// Temps restant
reservationDateTime.fromNow(); // "dans 3 jours"

// Vérifier si c'est aujourd'hui
reservationDateTime.isSame(moment(), "day"); // true/false
```

**Pourquoi ISO 8601 ?**

- ✅ Standard universel
- ✅ Compatible avec tous les langages (JS, Python, Java, PHP...)
- ✅ Compatible avec Moment.js, Day.js, date-fns
- ✅ Tri alphabétique = tri chronologique
- ✅ Pas de problème de timezone

---

## 👤 Questions sur `/users/me`

### Q1: À quoi sert le rôle ?

**Réponse:** 🔄 **Rôle supprimé de l'API client**

**Décision architecturale:**

#### Séparation Client / Pro

```
┌─────────────────────┐
│   API CLIENTS       │
│   /users/me         │ ← Pas de rôle
│   /reservations     │
│   /nightclubs       │
└─────────────────────┘

┌─────────────────────┐
│   API PROS          │
│   /pro/me           │ ← Avec rôle
│   /pro/dashboard    │
│   /pro/staff        │
└─────────────────────┘
```

**Justification:**

1. 🎯 **Séparation des préoccupations**

   - Client = Consommateur (réserver, sortir)
   - Pro = Gestionnaire (gérer club, staff, réservations)

2. 🔒 **Sécurité**

   - Endpoints différents = permissions différentes
   - Token client ≠ Token pro
   - Évite les confusions de droits

3. 🎨 **UX différente**
   - App client = Interface grand public
   - App pro = Back-office / Dashboard
   - Besoins et flows totalement différents

**Proposition API Pros (future):**

```typescript
GET /pro/me
{
  "id": 2,
  "firstname": "Alexandre",
  "lastname": "Dubois",
  "email": "alex@lemoonlight.fr",
  "role": "manager",           
  "nightclub_id": 1,
  "nightclub_name": "Le Moonlight",
  "permissions": [
    "manage_reservations",
    "manage_tables",
    "manage_products",
    "view_dashboard"
  ],
  "is_owner": true
}
```

**Rôles suggérés pour l'API Pro:**

```typescript
enum ProRole {
  OWNER = "owner", // Propriétaire
  MANAGER = "manager", // Gérant
  STAFF = "staff", // Employé
  ADMIN = "admin", // Super admin (multi-clubs)
}
```

---

### Q2: Genre du user - valeurs possibles ?

**Réponse:** ✅ **Validé et implémenté**

```typescript
enum Gender {
  FEMALE = "female", // Femme
  MALE = "male", // Homme
  OTHER = "other", // Autre / Non-binaire
}
```

**Règles d'affichage suggérées:**

```javascript
const genderLabels = {
  female: "👩 Femme",
  male: "👨 Homme",
  other: "🧑 Autre",
};

const genderIcons = {
  female: "♀️",
  male: "♂️",
  other: "⚧",
};
```

**Utilisation dans les réservations:**

- `male_count` - Nombre d'hommes
- `female_count` - Nombre de femmes
- `other_count` - Nombre de personnes autres
- `guest_count` - Total (= male + female + other)

**Règles métier:**

```javascript
// Validation
if (male_count + female_count + other_count !== guest_count) {
  throw new Error("La somme ne correspond pas");
}

// Calcul du ratio (pour les règles du club)
const femaleRatio = female_count / guest_count;
if (femaleRatio < club.rules.min_women_ratio) {
  throw new Error("Ratio de femmes insuffisant");
}
```

---

## 📊 Résumé des Réponses

| Question                         | Réponse                   | Statut           |
| -------------------------------- | ------------------------- | ---------------- |
| Pagination nightclubs            | Oui, recommandé           | 🔜 À implémenter |
| API liste vs détail nightclubs   | Oui, séparé               | ✅ Implémenté    |
| Statuts réservations             | 6 statuts définis         | ✅ Implémenté    |
| API liste vs détail réservations | Oui, séparé               | ✅ Implémenté    |
| Format dates (Moment)            | ISO 8601                  | ✅ Implémenté    |
| Rôle dans /users/me              | Supprimé (API Pro future) | ✅ Implémenté    |
| Genre user                       | 3 valeurs (F/M/Other)     | ✅ Implémenté    |

---

## 🚀 Prochaines Étapes Recommandées

### Court terme (Sprint 1)

1. ✅ Tester les nouvelles APIs en développement
2. ⏳ Implémenter la pagination sur `/nightclubs` et `/reservations`
3. ⏳ Ajouter des filtres de recherche
4. ⏳ Créer des fixtures avec plus de données (50+ clubs, 100+ réservations)

### Moyen terme (Sprint 2-3)

1. ⏳ Créer l'API Pros (`/pro/*`)
2. ⏳ Implémenter le système de permissions
3. ⏳ Ajouter la recherche géolocalisée
4. ⏳ WebSockets pour les notifications temps réel

### Long terme (Post-MVP)

1. ⏳ API GraphQL (alternative au REST)
2. ⏳ Rate limiting et cache
3. ⏳ Analytics et tracking
4. ⏳ Recommandations personnalisées

---

**Document créé le:** 25 octobre 2025  
**Version:** 1.0  
**Auteur:** Équipe Zerve API
