-- =========================================================
-- Zerve MVP - PostgreSQL DDL (Pure Schema Only)
-- =========================================================
-- Conventions:
-- - Montants en centimes (INTEGER)
-- - created_at / updated_at en timestamptz
-- - ON DELETE CASCADE pour les entités dépendantes fortes
-- - ON DELETE SET NULL quand la donnée peut survivre sans la FK
-- =========================================================

-- ---------- 1) Rôles / Utilisateurs
CREATE TABLE roles (
  id            BIGSERIAL PRIMARY KEY,
  name          VARCHAR(50) UNIQUE NOT NULL,   -- ex: user, manager, admin, staff
  description   TEXT
);

CREATE TABLE users (
  id            BIGSERIAL PRIMARY KEY,
  firstname     VARCHAR(100) NOT NULL,
  lastname      VARCHAR(100),
  email         VARCHAR(150) UNIQUE NOT NULL,
  tel           VARCHAR(30),
  password_hash VARCHAR(255) NOT NULL,
  gender        VARCHAR(10) CHECK (gender IN ('male','female','other')),
  birthdate     DATE,
  role_id       BIGINT REFERENCES roles(id) ON UPDATE RESTRICT ON DELETE SET NULL,
  profile_image TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_role_id ON users(role_id);
CREATE INDEX idx_users_email ON users(email);

-- ---------- 2) Établissements et configuration
CREATE TABLE nightclubs (
  id            BIGSERIAL PRIMARY KEY,
  owner_id      BIGINT REFERENCES users(id) ON UPDATE RESTRICT ON DELETE SET NULL,
  name          VARCHAR(150) NOT NULL,
  description   TEXT,
  address       TEXT,
  city          VARCHAR(100),
  country       VARCHAR(100),
  latitude      DECIMAL(9,6),
  longitude     DECIMAL(9,6),
  phone         VARCHAR(30),
  website       VARCHAR(200),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_nightclubs_owner_id ON nightclubs(owner_id);
CREATE INDEX idx_nightclubs_city ON nightclubs(city);

CREATE TABLE nightclub_rules (
  id                   BIGSERIAL PRIMARY KEY,
  nightclub_id         BIGINT NOT NULL REFERENCES nightclubs(id) ON UPDATE RESTRICT ON DELETE CASCADE,
  allow_male_only      BOOLEAN NOT NULL DEFAULT FALSE,
  min_women_ratio      DECIMAL(3,2) NOT NULL DEFAULT 0.00, -- ex: 0.30 = 30%
  max_people_per_table INT NOT NULL DEFAULT 10,
  dynamic_pricing      BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE (nightclub_id)
);

CREATE TABLE nightclub_opening_hours (
  id            BIGSERIAL PRIMARY KEY,
  nightclub_id  BIGINT NOT NULL REFERENCES nightclubs(id) ON UPDATE RESTRICT ON DELETE CASCADE,
  day_of_week   SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=dimanche
  open_time     TIME,
  close_time    TIME,
  UNIQUE (nightclub_id, day_of_week)
);

CREATE INDEX idx_opening_hours_club ON nightclub_opening_hours(nightclub_id);

-- ---------- 3) Plan de salle et tables
CREATE TABLE tables (
  id            BIGSERIAL PRIMARY KEY,
  nightclub_id  BIGINT NOT NULL REFERENCES nightclubs(id) ON UPDATE RESTRICT ON DELETE CASCADE,
  number        INT NOT NULL,
  capacity      INT NOT NULL,
  min_spend     INT NOT NULL DEFAULT 0,        -- en centimes
  position_x    INT,
  position_y    INT,
  rotation      SMALLINT NOT NULL DEFAULT 0,
  status        VARCHAR(20) NOT NULL CHECK (status IN ('available','reserved','disabled')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (nightclub_id, number)
);

CREATE INDEX idx_tables_club ON tables(nightclub_id);
CREATE INDEX idx_tables_status ON tables(status);

-- ---------- 4) Catalogue produits
CREATE TABLE product_categories (
  id            BIGSERIAL PRIMARY KEY,
  nightclub_id  BIGINT NOT NULL REFERENCES nightclubs(id) ON UPDATE RESTRICT ON DELETE CASCADE,
  name          VARCHAR(100) NOT NULL,
  description   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (nightclub_id, name)
);

CREATE INDEX idx_product_categories_club ON product_categories(nightclub_id);

CREATE TABLE products (
  id            BIGSERIAL PRIMARY KEY,
  nightclub_id  BIGINT NOT NULL REFERENCES nightclubs(id) ON UPDATE RESTRICT ON DELETE CASCADE,
  category_id   BIGINT REFERENCES product_categories(id) ON UPDATE RESTRICT ON DELETE SET NULL,
  name          VARCHAR(150) NOT NULL,
  description   TEXT,
  price         INT NOT NULL,                  -- en centimes
  image_url     TEXT,
  is_available  BOOLEAN NOT NULL DEFAULT TRUE,
  is_featured   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (nightclub_id, name)
);

CREATE INDEX idx_products_club ON products(nightclub_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_available ON products(is_available);

-- ---------- 5) Réservations & invités
CREATE TABLE reservations (
  id            BIGSERIAL PRIMARY KEY,
  nightclub_id  BIGINT NOT NULL REFERENCES nightclubs(id) ON UPDATE RESTRICT ON DELETE CASCADE,
  user_id       BIGINT NOT NULL REFERENCES users(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  table_id      BIGINT NOT NULL REFERENCES tables(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  date          DATE NOT NULL,
  arrival_time  TIME NOT NULL,
  guest_count   INT NOT NULL,
  male_count    INT NOT NULL DEFAULT 0,
  female_count  INT NOT NULL DEFAULT 0,
  amount        INT NOT NULL DEFAULT 0,        -- pré-engagé / minimum / panier
  status        VARCHAR(20) NOT NULL CHECK (status IN ('pending','confirmed','to_finalize','cancelled','completed')),
  note          TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reservations_club ON reservations(nightclub_id);
CREATE INDEX idx_reservations_user ON reservations(user_id);
CREATE INDEX idx_reservations_table ON reservations(table_id);
CREATE INDEX idx_reservations_date ON reservations(date, arrival_time);
CREATE INDEX idx_reservations_status ON reservations(status);

CREATE TABLE reservation_items (
  id              BIGSERIAL PRIMARY KEY,
  reservation_id  BIGINT NOT NULL REFERENCES reservations(id) ON UPDATE RESTRICT ON DELETE CASCADE,
  product_id      BIGINT NOT NULL REFERENCES products(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  quantity        INT NOT NULL DEFAULT 1,
  unit_price      INT NOT NULL,               -- snapshot du prix (centimes)
  total_price     INT NOT NULL,               -- = quantity * unit_price
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_res_items_res ON reservation_items(reservation_id);
CREATE INDEX idx_res_items_product ON reservation_items(product_id);

CREATE TABLE reservation_guests (
  id              BIGSERIAL PRIMARY KEY,
  reservation_id  BIGINT NOT NULL REFERENCES reservations(id) ON UPDATE RESTRICT ON DELETE CASCADE,
  user_id         BIGINT REFERENCES users(id) ON UPDATE RESTRICT ON DELETE SET NULL,
  invited_by      BIGINT REFERENCES users(id) ON UPDATE RESTRICT ON DELETE SET NULL,
  phone           VARCHAR(30),
  status          VARCHAR(20) NOT NULL CHECK (status IN ('invited','accepted','declined','paid')),
  amount_due      INT NOT NULL DEFAULT 0,
  amount_paid     INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_res_guests_res ON reservation_guests(reservation_id);
CREATE INDEX idx_res_guests_user ON reservation_guests(user_id);

-- ---------- 6) Commandes (QR ou liées à réservation)
CREATE TABLE orders (
  id              BIGSERIAL PRIMARY KEY,
  nightclub_id    BIGINT NOT NULL REFERENCES nightclubs(id) ON UPDATE RESTRICT ON DELETE CASCADE,
  table_id        BIGINT NOT NULL REFERENCES tables(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  reservation_id  BIGINT REFERENCES reservations(id) ON UPDATE RESTRICT ON DELETE SET NULL,
  user_id         BIGINT REFERENCES users(id) ON UPDATE RESTRICT ON DELETE SET NULL,
  amount          INT NOT NULL DEFAULT 0,           
  status          VARCHAR(20) NOT NULL CHECK (status IN ('pending','preparing','served','paid','cancelled')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_club ON orders(nightclub_id);
CREATE INDEX idx_orders_table ON orders(table_id);
CREATE INDEX idx_orders_res ON orders(reservation_id);
CREATE INDEX idx_orders_status ON orders(status);

CREATE TABLE order_items (
  id              BIGSERIAL PRIMARY KEY,
  order_id        BIGINT NOT NULL REFERENCES orders(id) ON UPDATE RESTRICT ON DELETE CASCADE,
  product_id      BIGINT NOT NULL REFERENCES products(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  quantity        INT NOT NULL DEFAULT 1,
  unit_price      INT NOT NULL,               
  total_price     INT NOT NULL,               
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);

-- ---------- 7) Paiements
CREATE TABLE payments (
  id              BIGSERIAL PRIMARY KEY,
  user_id         BIGINT REFERENCES users(id) ON UPDATE RESTRICT ON DELETE SET NULL,
  reservation_id  BIGINT REFERENCES reservations(id) ON UPDATE RESTRICT ON DELETE SET NULL,
  order_id        BIGINT REFERENCES orders(id) ON UPDATE RESTRICT ON DELETE SET NULL,
  amount          INT NOT NULL,               
  method          VARCHAR(20) NOT NULL CHECK (method IN ('card','apple_pay','google_pay','wallet')),
  status          VARCHAR(20) NOT NULL CHECK (status IN ('pending','succeeded','failed')),
  transaction_ref VARCHAR(255),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_res ON payments(reservation_id);
CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_payments_status ON payments(status);

-- ---------- 8) Notifications
CREATE TABLE notifications (
  id            BIGSERIAL PRIMARY KEY,
  user_id       BIGINT REFERENCES users(id) ON UPDATE RESTRICT ON DELETE CASCADE,
  type          VARCHAR(50) NOT NULL,         
  title         VARCHAR(150) NOT NULL,
  message       TEXT NOT NULL,
  link          TEXT,
  is_read       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

-- ---------- 9) Contraintes d'intégrité
ALTER TABLE reservations
  ADD CONSTRAINT chk_reservations_gender_sum
  CHECK ((male_count + female_count) <= guest_count);

ALTER TABLE reservation_items
  ADD CONSTRAINT chk_res_item_prices CHECK (unit_price >= 0 AND total_price = unit_price * quantity);

ALTER TABLE order_items
  ADD CONSTRAINT chk_order_item_prices CHECK (unit_price >= 0 AND total_price = unit_price * quantity);

ALTER TABLE payments
  ADD CONSTRAINT chk_payments_amount CHECK (amount > 0);

-- =========================================================
-- Fin du DDL (Pure Schema Only)
-- =========================================================

