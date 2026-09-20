-- White-Label AI Demo — database setup
-- Run this in MySQL (phpMyAdmin, mysql CLI, or: mysql -u root < schema.sql)

CREATE DATABASE IF NOT EXISTS white_label_ai_demo
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE white_label_ai_demo;

CREATE TABLE IF NOT EXISTS settings (
  id INT PRIMARY KEY,
  app_name VARCHAR(255) NOT NULL,
  logo_path VARCHAR(512) NOT NULL,
  active_model_name VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS predictions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  input_reference VARCHAR(512) NULL,
  label VARCHAR(255) NOT NULL,
  confidence FLOAT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Single settings row. Branding is loaded from here — never hardcode it in the UI.
INSERT INTO settings (id, app_name, logo_path, active_model_name)
VALUES (1, 'My AI App', '/uploads/default-logo.svg', 'No model connected yet')
ON DUPLICATE KEY UPDATE id = id;
