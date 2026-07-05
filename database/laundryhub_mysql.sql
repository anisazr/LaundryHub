CREATE DATABASE IF NOT EXISTS laundryhub
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE laundryhub;

CREATE TABLE users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  role ENUM('owner','admin','kasir','customer') NOT NULL,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(30) NULL,
  address TEXT NULL,
  avatar_url TEXT NULL,
  two_step_enabled TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE service_packages (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  price_per_kg DECIMAL(12,2) NOT NULL,
  duration_hours INT UNSIGNED NOT NULL,
  description TEXT NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE company_settings (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(80) NOT NULL UNIQUE,
  setting_value VARCHAR(255) NOT NULL
);

CREATE TABLE company_bank_accounts (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  bank VARCHAR(80) NOT NULL,
  account_no VARCHAR(80) NOT NULL,
  account_name VARCHAR(160) NOT NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE orders (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_code VARCHAR(30) NOT NULL UNIQUE,
  customer_id BIGINT UNSIGNED NOT NULL,
  package_id BIGINT UNSIGNED NOT NULL,
  customer_name VARCHAR(120) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  pickup_address TEXT NOT NULL,
  weight_kg DECIMAL(8,2) NOT NULL,
  total DECIMAL(12,2) NOT NULL,
  source ENUM('kasir','online') NOT NULL DEFAULT 'online',
  status ENUM('diterima','dicuci','disetrika','siap','diantar','selesai','batal') NOT NULL DEFAULT 'diterima',
  pickup_at DATETIME NOT NULL,
  due_at DATETIME NOT NULL,
  delivery_at DATETIME NULL,
  paid TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES users(id),
  FOREIGN KEY (package_id) REFERENCES service_packages(id),
  INDEX idx_orders_pickup_status (pickup_at, status)
);

CREATE TABLE payments (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT UNSIGNED NOT NULL,
  method ENUM('tunai','kartu','qris','transfer_bank') NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  company_bank_account_id BIGINT UNSIGNED NULL,
  provider_reference VARCHAR(160) NULL,
  status ENUM('menunggu','berhasil','gagal') NOT NULL DEFAULT 'menunggu',
  paid_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (company_bank_account_id) REFERENCES company_bank_accounts(id)
);

CREATE TABLE ledger_entries (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  type ENUM('modal','pendapatan','pembelian','gaji') NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  detail TEXT NOT NULL,
  payment_id BIGINT UNSIGNED NULL,
  employee_id BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (payment_id) REFERENCES payments(id),
  FOREIGN KEY (employee_id) REFERENCES users(id)
);

CREATE TABLE inventory_items (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  unit VARCHAR(30) NOT NULL,
  qty DECIMAL(12,2) NOT NULL DEFAULT 0,
  min_qty DECIMAL(12,2) NOT NULL DEFAULT 0,
  purchase_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  supplier VARCHAR(160) NULL
);

CREATE TABLE delivery_tasks (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT UNSIGNED NOT NULL,
  courier_id BIGINT UNSIGNED NULL,
  task_type ENUM('jemput','antar') NOT NULL,
  address TEXT NOT NULL,
  scheduled_at DATETIME NOT NULL,
  status ENUM('terjadwal','berjalan','selesai') NOT NULL DEFAULT 'terjadwal',
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (courier_id) REFERENCES users(id)
);

CREATE TABLE chat_messages (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  customer_id BIGINT UNSIGNED NOT NULL,
  sender_id BIGINT UNSIGNED NULL,
  sender_role ENUM('customer','admin','kasir') NOT NULL,
  body TEXT NOT NULL,
  read_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES users(id),
  FOREIGN KEY (sender_id) REFERENCES users(id)
);

CREATE TABLE audit_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NULL,
  module VARCHAR(80) NOT NULL,
  action VARCHAR(40) NOT NULL,
  detail TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

INSERT INTO users (role, name, email, password_hash, phone, address, two_step_enabled) VALUES
('owner', 'Owner LaundryHub', 'owner@laundryhub.local', '$2y$10$replace_with_real_hash', '081200000001', 'Kantor LaundryHub', 1),
('admin', 'Anisa Az-Zahro', 'admin@gmail.com', '$2y$10$replace_with_real_hash', '081200000002', 'LaundryHub Office', 1),
('kasir', 'Kasir LaundryHub', 'kasir@gmail.com', '$2y$10$replace_with_real_hash', '081200000003', 'LaundryHub Counter', 1),
('customer', 'Dina Rahma', 'dina@mail.com', '$2y$10$replace_with_real_hash', '081288880000', 'Jl. Anggrek No. 8, Jakarta Selatan', 0);

INSERT INTO service_packages (name, price_per_kg, duration_hours, description, active) VALUES
('Cuci Kering', 7000, 24, 'Cuci dan kering tanpa setrika', 1),
('Cuci Setrika', 10000, 48, 'Paket lengkap cuci + setrika rapi', 1),
('Express 6 Jam', 18000, 6, 'Selesai dalam 6 jam jika kapasitas tersedia', 1),
('Dry Clean', 25000, 72, 'Khusus jas, gaun, dan kain halus', 1);

INSERT INTO company_settings (setting_key, setting_value) VALUES
('daily_capacity_kg', '100'),
('owner_verification_code', 'OWNER-2026'),
('qris_merchant', 'LaundryHub DataNova');

INSERT INTO company_bank_accounts (bank, account_no, account_name, active, created_by) VALUES
('BCA', '1234567890', 'LaundryHub DataNova', 1, 2),
('Mandiri', '9876543210', 'LaundryHub DataNova', 1, 2);
